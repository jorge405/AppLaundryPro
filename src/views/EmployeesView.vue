<script setup>
import { ref, computed } from 'vue'
import { useEmployeesStore } from '@/stores/employees.js'
import { useBranchesStore } from '@/stores/branches.js'
import { useAuthStore, ROLES, ROLE_LABELS } from '@/stores/auth.js'
import EmployeeFormModal from '@/components/EmployeeFormModal.vue'
import StatCard from '@/components/StatCard.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const employees = useEmployeesStore()
const branches = useBranchesStore()
const auth = useAuthStore()
const toast = useToast()
const { confirm } = useConfirm()

const modalOpen = ref(false)
const editing = ref(null)
const search = ref('')
const filterRole = ref('all')
const filterBranch = ref('all')

const canManage = computed(() => auth.can('employees.create'))

const filtered = computed(() => {
  let list = employees.list
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(e =>
      (e.name || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.position || '').toLowerCase().includes(q)
    )
  }
  if (filterRole.value !== 'all') list = list.filter(e => (e.role || ROLES.EMPLOYEE) === filterRole.value)
  if (filterBranch.value !== 'all') list = list.filter(e => e.branchId === filterBranch.value)
  return list
})

function openCreate() { editing.value = null; modalOpen.value = true }
function openEdit(e) { editing.value = e; modalOpen.value = true }

async function handleDelete(e) {
  const ok = await confirm({
    title: 'Eliminar empleado',
    message: `¿Eliminar a "${e.name}"?`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (!ok) return
  employees.removeEmployee(e.id)
  toast.success('Empleado eliminado')
}

function toggleActive(e) {
  employees.updateEmployee(e.id, { active: e.active === false })
  toast.info(e.active === false ? 'Empleado activado' : 'Empleado desactivado')
}

function roleLabel(r) { return ROLE_LABELS[r] || ROLE_LABELS[ROLES.EMPLOYEE] }
function branchName(e) { return e.branchName || branches.getById(e.branchId)?.name || 'Sin sucursal' }
</script>

<template>
  <div class="space-y-5">

    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Empleados" :value="employees.stats.total" color="indigo"
        icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      <StatCard label="Activos" :value="employees.stats.active" color="emerald"
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      <StatCard label="Empleados operativos" :value="employees.stats.byRole[ROLES.EMPLOYEE] || 0" color="sky"
        icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      <StatCard label="Administradores" :value="employees.stats.byRole[ROLES.ADMIN] || 0" color="violet"
        icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </section>

    <!-- Filtros -->
    <div class="card p-4 flex flex-col lg:flex-row gap-3 items-center">
      <div class="flex-1">
        <h2 class="font-semibold text-slate-900">Gestión de empleados</h2>
        <p class="text-xs text-slate-500">Personal con acceso al sistema y su sucursal asignada</p>
      </div>
      <input v-model="search" class="input w-full lg:w-60" placeholder="Buscar empleado..." />
      <select v-model="filterRole" class="input w-auto min-w-45">
        <option value="all">Todos los roles</option>
        <option :value="ROLES.EMPLOYEE">Empleado</option>
        <option :value="ROLES.ADMIN">Administrador del negocio</option>
      </select>
      <select v-model="filterBranch" class="input w-auto min-w-45">
        <option value="all">Todas las sucursales</option>
        <option v-for="b in branches.list" :key="b.id" :value="b.id">{{ b.name }}</option>
      </select>
      <button v-if="canManage" @click="openCreate" class="btn-primary shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Nuevo empleado
      </button>
    </div>

    <!-- Tarjetas -->
    <div v-if="filtered.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="e in filtered" :key="e.id" class="card p-5 flex flex-col gap-3">
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-xl bg-linear-to-tr from-indigo-500 to-violet-500 grid place-items-center text-white font-semibold shrink-0">
            {{ (e.name || '?')[0].toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-slate-900 truncate">{{ e.name }}</p>
            <p class="text-xs text-slate-500 truncate">{{ e.email }}</p>
          </div>
          <span
            class="px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
            :class="e.active === false
              ? 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200'
              : (e.role === ROLES.ADMIN ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700')"
          >
            {{ e.active === false ? 'Inactivo' : roleLabel(e.role) }}
          </span>
        </div>

        <div class="text-xs text-slate-600 space-y-1">
          <p v-if="e.position"><span class="text-slate-400">Puesto:</span> {{ e.position }}</p>
          <p v-if="e.phone"><span class="text-slate-400">Teléfono:</span> {{ e.phone }}</p>
          <p><span class="text-slate-400">Sucursal:</span> {{ branchName(e) }}</p>
        </div>

        <p v-if="e.notes" class="text-xs text-slate-500 line-clamp-2">{{ e.notes }}</p>

        <div v-if="canManage" class="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button @click="openEdit(e)" class="btn-ghost text-xs p-2" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button @click="toggleActive(e)" class="btn-ghost text-xs p-2 ml-auto" :title="e.active === false ? 'Activar' : 'Desactivar'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
          <button @click="handleDelete(e)" class="btn-ghost text-xs text-rose-500 hover:bg-rose-50 p-2" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A6 6 0 0116.138 21H7.862a6 6 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="card p-12 text-center">
      <p class="text-slate-400 text-sm">
        {{ employees.stats.total ? 'No hay empleados con esos filtros.' : 'Registra al personal del negocio para que puedan iniciar sesión.' }}
      </p>
      <button v-if="canManage && !employees.stats.total" @click="openCreate" class="btn-primary mt-4">Registrar primer empleado</button>
    </div>

    <EmployeeFormModal v-model="modalOpen" :employee="editing" />
  </div>
</template>
