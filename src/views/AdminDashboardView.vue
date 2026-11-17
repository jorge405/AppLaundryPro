<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useBranchesStore } from '@/stores/branches.js'
import { useItemsStore } from '@/stores/items.js'
import { useEmployeesStore } from '@/stores/employees.js'
import { useSettingsStore } from '@/stores/settings.js'

const branches = useBranchesStore()
const items = useItemsStore()
const employees = useEmployeesStore()
const settings = useSettingsStore()

/** Sucursales visibles */
const list = computed(() => branches.list)

/** Ingresos acumulados de todas las sucursales */
const totalIncome = computed(() =>
  list.value.reduce((s, b) => s + items.monthEarningsOf(b.id), 0)
)

/** Ingresos históricos (cobrados) de todas las sucursales */
const totalAllTime = computed(() => items.totalEarnings)

function monthLabel(key) {
  const [y, m] = key.split('-')
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${names[Number(m) - 1]} ${y.slice(2)}`
}

/** Tendencia de 6 meses sumando todas las sucursales */
const trend = computed(() => {
  const map = new Map()
  for (const b of list.value) {
    for (const t of items.monthlyTrend(b.id, 6)) {
      map.set(t.month, (map.get(t.month) || 0) + t.total)
    }
  }
  return [...map.entries()]
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
})

const maxTrend = computed(() => Math.max(1, ...trend.value.map(t => t.total)))

/** Empleados visibles */
const staff = computed(() => employees.list)

function branchOf(e) {
  return e.branchName || branches.getById(e.branchId)?.name || 'Sin sucursal'
}
</script>

<template>
  <div class="space-y-6">

    <!-- Resumen -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-indigo-50 grid place-items-center text-xl shrink-0">🏪</div>
        <div class="min-w-0">
          <p class="text-xs text-slate-500">Cantidad de sucursales</p>
          <p class="text-2xl font-bold text-slate-900">{{ list.length }}</p>
        </div>
      </div>

      <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-emerald-50 grid place-items-center text-xl shrink-0">💰</div>
        <div class="min-w-0">
          <p class="text-xs text-slate-500">Ingresos totales (del mes)</p>
          <p class="text-2xl font-bold text-emerald-600">{{ settings.format(totalIncome) }}</p>
        </div>
      </div>

      <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-sky-50 grid place-items-center text-xl shrink-0">📈</div>
        <div class="min-w-0">
          <p class="text-xs text-slate-500">Ingresos acumulados</p>
          <p class="text-2xl font-bold text-slate-900">{{ settings.format(totalAllTime) }}</p>
        </div>
      </div>

      <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-violet-50 grid place-items-center text-xl shrink-0">👥</div>
        <div class="min-w-0">
          <p class="text-xs text-slate-500">Empleados</p>
          <p class="text-2xl font-bold text-slate-900">{{ staff.length }}</p>
        </div>
      </div>
    </section>

    <!-- Tendencia de ingresos -->
    <section v-if="trend.length" class="card p-6">
      <h2 class="font-semibold text-slate-900 mb-1">Ingresos de todas las sucursales</h2>
      <p class="text-sm text-slate-500 mb-5">Suma mensual de todas las sucursales</p>
      <div class="space-y-3">
        <div v-for="t in trend" :key="t.month" class="flex items-center gap-3">
          <span class="w-16 text-xs text-slate-500 shrink-0">{{ monthLabel(t.month) }}</span>
          <div class="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
            <div
              class="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-end px-2"
              :style="{ width: Math.max(2, Math.round((t.total / maxTrend) * 100)) + '%' }"
            >
              <span class="text-[10px] font-semibold text-white">{{ settings.format(t.total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="grid lg:grid-cols-2 gap-6">

      <!-- Sucursales -->
      <section class="card p-6">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-semibold text-slate-900">Sucursales</h2>
            <p class="text-sm text-slate-500">{{ list.length }} registradas</p>
          </div>
          <RouterLink :to="{ name: 'branches' }" class="btn-primary text-xs px-3 py-2 whitespace-nowrap">
            Ir a sucursales →
          </RouterLink>
        </div>

        <div v-if="!list.length" class="text-center py-8 text-slate-400 text-sm">
          Aún no hay sucursales registradas.
        </div>

        <ul v-else class="divide-y divide-slate-100">
          <li v-for="b in list" :key="b.id" class="py-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-indigo-50 grid place-items-center shrink-0">🏪</div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-800 truncate">{{ b.name }}</p>
              <p class="text-xs text-slate-500 truncate">{{ b.manager || 'Sin responsable' }}</p>
            </div>
            <p class="text-sm font-semibold text-emerald-600 shrink-0">
              {{ settings.format(items.monthEarningsOf(b.id)) }}
            </p>
          </li>
        </ul>
      </section>

      <!-- Empleados -->
      <section class="card p-6">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-semibold text-slate-900">Empleados</h2>
            <p class="text-sm text-slate-500">{{ staff.length }} en el equipo</p>
          </div>
          <RouterLink :to="{ name: 'employees' }" class="btn-primary text-xs px-3 py-2 whitespace-nowrap">
            Ir a empleados →
          </RouterLink>
        </div>

        <div v-if="!staff.length" class="text-center py-8 text-slate-400 text-sm">
          Aún no hay empleados registrados.
        </div>

        <ul v-else class="divide-y divide-slate-100">
          <li v-for="e in staff" :key="e.id" class="py-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-500 to-violet-500 grid place-items-center text-white text-sm font-semibold shrink-0">
              {{ (e.name || '?')[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-800 truncate">{{ e.name }}</p>
              <p class="text-xs text-slate-500 truncate">{{ branchOf(e) }}</p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full shrink-0"
              :class="e.active === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'">
              {{ e.active === false ? 'Inactivo' : 'Activo' }}
            </span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
