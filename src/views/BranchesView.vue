<script setup>
import { ref, computed } from 'vue'
import { useBranchesStore } from '@/stores/branches.js'
import { useItemsStore } from '@/stores/items.js'
import { useMaterialsStore } from '@/stores/materials.js'
import { useSuperAdminStore } from '@/stores/superadmin.js'
import { useAuthStore } from '@/stores/auth.js'
import { useSettingsStore } from '@/stores/settings.js'
import BranchFormModal from '@/components/BranchFormModal.vue'
import StatCard from '@/components/StatCard.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const branches = useBranchesStore()
const items = useItemsStore()
const materials = useMaterialsStore()
const sa = useSuperAdminStore()
const auth = useAuthStore()
const settings = useSettingsStore()
const toast = useToast()
const { confirm } = useConfirm()

const modalOpen = ref(false)
const editing = ref(null)
const filterCompany = ref(auth.companyId || 'all')

/** El encargado solo ve las sucursales de su empresa */
const visibleBranches = computed(() => {
  let list = branches.list
  if (auth.isManager) list = list.filter(b => b.companyId === auth.companyId)
  if (filterCompany.value !== 'all') list = list.filter(b => b.companyId === filterCompany.value)
  return list
})

const companiesInUse = computed(() => {
  const set = new Map()
  for (const b of branches.list) {
    if (b.companyId) set.set(b.companyId, b.companyName || 'Empresa')
  }
  return [...set.entries()].map(([id, name]) => ({ id, name }))
})

const monthKey = new Date().toISOString().slice(0, 7)

function openCreate() { editing.value = null; modalOpen.value = true }
function openEdit(b) { editing.value = b; modalOpen.value = true }

async function handleDelete(b) {
  const ok = await confirm({
    title: 'Eliminar sucursal',
    message: `¿Eliminar la sucursal "${b.name}"? Las prendas registradas seguirán guardadas.`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (!ok) return
  branches.removeBranch(b.id)
  toast.success('Sucursal eliminada')
}

function toggleActive(b) {
  branches.updateBranch(b.id, { active: b.active === false })
  toast.info(b.active === false ? 'Sucursal activada' : 'Sucursal archivada')
}

/** Ingresos del mes y serie de los últimos 6 meses de una sucursal */
function monthTotal(b) { return items.monthEarningsOf(b.id) }
function trend(b) { return items.monthlyTrend(b.id, 6) }
function maxTrend(b) {
  const t = trend(b)
  return Math.max(1, ...t.map(x => x.total))
}
function monthLabel(key) {
  const [y, m] = key.split('-')
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${names[Number(m) - 1]} ${y.slice(2)}`
}

/** Prendas y materiales vinculados a la sucursal */
function itemsOf(b) { return items.items.filter(i => i.branchId === b.id).length }
function stockOf(b) {
  return materials.materials
    .filter(m => m.branchId === b.id)
    .reduce((s, m) => s + (Number(m.stock) || 0), 0)
}
</script>

<template>
  <div class="space-y-5">
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Sucursales" :value="visibleBranches.length" color="indigo"
        icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      <StatCard label="Activas" :value="visibleBranches.filter(b => b.active !== false).length" color="emerald"
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      <StatCard label="Ingresos del mes" :value="settings.format(visibleBranches.reduce((s, b) => s + monthTotal(b), 0))" color="sky"
        icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <StatCard label="Prendas registradas" :value="visibleBranches.reduce((s, b) => s + itemsOf(b), 0)" color="violet"
        icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </section>

    <!-- Filtros -->
    <div class="card p-4 flex flex-col lg:flex-row gap-3 items-center">
      <div class="flex-1">
        <h2 class="font-semibold text-slate-900">Sucursales</h2>
        <p class="text-xs text-slate-500">
          <template v-if="auth.isManager">
            Empresa: {{ auth.companyName || 'sin empresa asignada' }}
          </template>
          <template v-else>
            Vista general de todas las sucursales
          </template>
        </p>
      </div>
      <select v-if="!auth.isManager && companiesInUse.length" v-model="filterCompany" class="input w-auto min-w-45">
        <option value="all">Todas las empresas</option>
        <option v-for="c in companiesInUse" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <button @click="openCreate" class="btn-primary shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Nueva sucursal
      </button>
    </div>

    <!-- Tarjetas de sucursales -->
    <div v-if="visibleBranches.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="b in visibleBranches"
        :key="b.id"
        class="card p-5 flex flex-col gap-4 hover:shadow-md transition"
        :class="b.active === false ? 'opacity-60' : ''"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold text-slate-900 truncate">{{ b.name }}</p>
            <p class="text-xs text-slate-500 truncate">{{ b.companyName || 'Sin empresa' }}</p>
          </div>
          <span
            :class="[
              'px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset shrink-0',
              b.active === false
                ? 'bg-slate-100 text-slate-600 ring-slate-200'
                : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            ]"
          >
            {{ b.active === false ? 'Archivada' : 'Activa' }}
          </span>
        </div>

        <div class="space-y-1.5 text-sm text-slate-600">
          <p class="flex items-start gap-2">
            <svg class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span class="truncate">{{ b.address }}</span>
          </p>
          <p class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{{ b.openTime }} — {{ b.closeTime }}</span>
          </p>
          <p class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <span class="truncate">{{ b.manager }}</span>
          </p>
          <p v-if="b.phone" class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h2l2 5-2 1a11 11 0 005 5l1-2 5 2v2a2 2 0 01-2 2A16 16 0 013 5z"/></svg>
            <span>{{ b.phone }}</span>
          </p>
        </div>

        <!-- Ingresos del mes -->
        <div class="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
          <div class="flex items-center justify-between">
            <p class="text-xs uppercase tracking-wide text-emerald-700">Ingresos del mes ({{ monthKey }})</p>
            <p class="font-bold text-emerald-700">{{ settings.format(monthTotal(b)) }}</p>
          </div>
          <div class="flex items-end gap-1 mt-3 h-16">
            <div v-for="t in trend(b)" :key="t.month" class="flex-1 flex flex-col items-center gap-1">
              <div
                class="w-full rounded-t bg-emerald-400/80"
                :style="{ height: `${Math.max(3, (t.total / maxTrend(b)) * 56)}px` }"
                :title="`${t.month}: ${settings.format(t.total)}`"
              ></div>
              <span class="text-[9px] text-emerald-700/80">{{ monthLabel(t.month) }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
          <span>{{ itemsOf(b) }} prendas</span>
          <span>{{ stockOf(b) }} unid. en stock</span>
        </div>

        <div class="flex items-center gap-2">
          <button @click="openEdit(b)" class="btn-ghost text-xs px-2.5 py-1.5 border border-slate-200">Editar</button>
          <button @click="toggleActive(b)" class="btn-ghost text-xs px-2.5 py-1.5 border border-slate-200">
            {{ b.active === false ? 'Activar' : 'Archivar' }}
          </button>
          <button @click="handleDelete(b)" class="btn-ghost text-xs px-2.5 py-1.5 text-rose-500 hover:bg-rose-50 ml-auto">
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <div v-else class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-linear-to-tr from-indigo-100 to-violet-100 grid place-items-center text-2xl mb-4">🏪</div>
      <h3 class="font-semibold text-slate-900">Sin sucursales</h3>
      <p class="text-sm text-slate-500 mt-1 mb-5">Crea la primera sucursal con su dirección, horario y responsable.</p>
      <button @click="openCreate" class="btn-primary">Crear sucursal</button>
    </div>

    <BranchFormModal v-model="modalOpen" :branch="editing" />
  </div>
</template>
