import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'

/**
 * Roles del sistema:
 *  - 'employee'  → EMPLEADO: opera el día a día (prendas, materiales, máquinas, clientes).
 *  - 'admin'     → ADMINISTRADOR DEL NEGOCIO: ve y crea sucursales, reportes y gestión de empleados.
 *                   No crea prendas, ni máquinas, ni materiales, ni gestiona clientes.
 */
export const ROLES = {
  EMPLOYEE: 'employee',
  ADMIN: 'admin'
}

export const ROLE_LABELS = {
  employee: 'Empleado',
  admin: 'Administrador del negocio'
}

/**
 * Permisos por rol.
 * Los empleados tienen todo lo que el sistema hacía originalmente.
 */
export const PERMISSIONS = {
  employee: [
    'items.view', 'items.create', 'items.edit', 'items.cancel', 'items.archive', 'items.delete',
    'materials.view', 'materials.create', 'materials.edit', 'materials.stock', 'materials.delete',
    'machines.view', 'machines.create', 'machines.edit', 'machines.status', 'machines.delete',
    'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
    'earnings.view'
  ],
  admin: [
    'items.view',
    'materials.view',
    'machines.view',
    'branches.view', 'branches.create', 'branches.edit', 'branches.delete',
    'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
    'reports.view', 'earnings.view', 'settings.edit'
  ]
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(storage.get('user'))

  // Migración de roles antiguos ('owner' / 'manager') al esquema actual
  if (user.value && user.value.role && !PERMISSIONS[user.value.role]) {
    user.value = { ...user.value, role: ROLES.EMPLOYEE }
    storage.set('user', user.value)
  }

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role || ROLES.EMPLOYEE)
  const isEmployee = computed(() => role.value === ROLES.EMPLOYEE)
  const isAdmin = computed(() => role.value === ROLES.ADMIN)
  /** Alias heredado: el administrador del negocio es el "manager" de una empresa */
  const isManager = computed(() => isAdmin.value)
  const companyId = computed(() => user.value?.companyId || '')
  const companyName = computed(() => user.value?.companyName || '')
  const roleLabel = computed(() => ROLE_LABELS[role.value] || ROLE_LABELS.employee)

  /** Lista de permisos del rol actual */
  const permissions = computed(() => PERMISSIONS[role.value] || [])

  /**
   * Comprueba si el usuario actual tiene un permiso.
   * @param {string} permission p.ej. 'items.create'
   */
  function can(permission) {
    return permissions.value.includes(permission)
  }

  /** ¿Puede el usuarioActual crear/editar este módulo? */
  function canAny(list) {
    return list.some(p => can(p))
  }

  function login(name, email, extra = {}) {
    user.value = {
      name: name || 'Usuario',
      email: email || '',
      role: ROLES.EMPLOYEE,
      loginAt: new Date().toISOString(),
      ...extra
    }
    storage.set('user', user.value)
  }

  function logout() {
    user.value = null
    storage.remove('user')
  }

  return {
    user, isAuthenticated, role, isEmployee, isAdmin, isManager,
    companyId, companyName, roleLabel, permissions,
    can, canAny, login, logout
  }
})
