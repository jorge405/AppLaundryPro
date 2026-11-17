import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'
import { ROLES } from '@/stores/auth.js'

/**
 * Personal del negocio (empleados).
 * Cada empleado puede iniciar sesión con su email y contraseña.
 * El administrador del negocio gestiona este listado.
 */
/** Empleados de ejemplo (solo la primera vez) */
export const DEFAULT_EMPLOYEES = [
  {
    id: 'emp-demo-1',
    name: 'Empleado Demo',
    email: 'empleado@laundrypro.app',
    password: 'empleado123',
    phone: '700-00001',
    role: ROLES.EMPLOYEE,
    branchId: '',
    branchName: '',
    position: 'Operador de lavandería',
    notes: 'Cuenta de ejemplo con permisos operativos.',
    active: true,
    createdAt: '2026-01-05T09:00:00.000Z'
  },
  {
    id: 'emp-demo-2',
    name: 'María Fernández',
    email: 'maria@laundrypro.app',
    password: 'empleado123',
    phone: '700-00002',
    role: ROLES.EMPLOYEE,
    branchId: '',
    branchName: '',
    position: 'Plancha y doblado',
    notes: 'Empleada de ejemplo.',
    active: true,
    createdAt: '2026-01-06T09:00:00.000Z'
  }
]

export const useEmployeesStore = defineStore('employees', () => {
  const employees = ref(storage.get('employees', DEFAULT_EMPLOYEES.map(e => ({ ...e }))))

  watch(employees, (v) => storage.set('employees', v), { deep: true })

  const list = computed(() =>
    [...employees.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  )

  const active = computed(() => list.value.filter(e => e.active !== false))

  const stats = computed(() => ({
    total: employees.value.length,
    active: active.value.length,
    byRole: list.value.reduce((acc, e) => {
      const r = e.role || ROLES.EMPLOYEE
      acc[r] = (acc[r] || 0) + 1
      return acc
    }, {})
  }))

  function addEmployee(data) {
    const employee = {
      id: uid(),
      name: (data.name || '').trim(),
      email: (data.email || '').trim().toLowerCase(),
      password: data.password || '1234',
      phone: (data.phone || '').trim(),
      role: data.role || ROLES.EMPLOYEE,
      branchId: data.branchId || '',
      branchName: data.branchName || '',
      position: (data.position || '').trim(),
      notes: (data.notes || '').trim(),
      active: data.active !== false,
      createdAt: new Date().toISOString()
    }
    employees.value.unshift(employee)
    return employee
  }

  function updateEmployee(id, data) {
    const idx = employees.value.findIndex(e => e.id === id)
    if (idx === -1) return
    employees.value[idx] = { ...employees.value[idx], ...data }
  }

  function removeEmployee(id) {
    employees.value = employees.value.filter(e => e.id !== id)
  }

  function getById(id) { return employees.value.find(e => e.id === id) }

  function byBranch(branchId) {
    return list.value.filter(e => e.branchId === branchId)
  }

  /** Busca un empleado activo por email y contraseña */
  function authenticate(email, password) {
    const mail = (email || '').trim().toLowerCase()
    return employees.value.find(
      e => (e.email || '').toLowerCase() === mail && e.password === password && e.active !== false
    ) || null
  }

  function reset() { employees.value = [] }

  return {
    employees, list, active, stats,
    addEmployee, updateEmployee, removeEmployee, getById, byBranch, authenticate, reset
  }
})
