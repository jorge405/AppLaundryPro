<script setup>
import { ref, computed } from 'vue'
import { useItemsStore, CATEGORIES, STATUSES } from '@/stores/items.js'
import { useBranchesStore } from '@/stores/branches.js'
import { useMaterialsStore } from '@/stores/materials.js'
import { useMachinesStore } from '@/stores/machines.js'
import { useEmployeesStore } from '@/stores/employees.js'
import { useAuthStore } from '@/stores/auth.js'
import { useSettingsStore } from '@/stores/settings.js'
import StatCard from '@/components/StatCard.vue'

const items = useItemsStore()
const branches = useBranchesStore()
const materials = useMaterialsStore()
const machines = useMachinesStore()
const employees = useEmployeesStore()
const auth = useAuthStore()
const settings = useSettingsStore()

/** Rango de meses del reporte */
const months = ref(6)

/** Solo sucursales de la empresa del administrador */
const scopedBranches = computed(() => {
  let list = branches.list
  if (auth.companyId) list = list.filter(b => b.companyId === auth.companyId)
  return list
})

const trend = computed(() => items.monthlyTrend(null, months.value))
const maxTrend = computed(() => Math.max(1, ...trend.value.map(t => t.total)))

const monthTotal = computed(() => {
  const m = new Date().toISOString().slice(0, 7)
  return trend.value.find(t => t.month === m)?.total || 0
})

/** Ingresos y prendas por sucursal */
const byBranch = computed(() =>
  scopedBranches.value
    .map(b => ({
      branch: b,
      total: items.monthEarningsOf(b.id),
      items: items.items.filter(i => i.branchId === b.id).length,
      employees: employees.byBranch(b.id).length
    }))
    .sort((a, b) => b.total - a.total)
)

/** Prendas por estado */
const byStatus = computed(() =>
  STATUSES.map(s => ({
    ...s,
    count: items.items.filter(i => i.status === s.id).length
  }))
)

/** Prendas por categoría */
const byCategory = computed(() =>
  CATEGORIES.map(c => ({
    ...c,
    count: items.items.filter(i => i.category === c.id).length
  })).filter(c => c.count > 0)
)

/** Top clientes por ingresos */
const topClients = computed(() => {
  const map = {}
  for (const i of items.paidItems) {
    const name = i.clientName || 'Sin cliente'
    if (!map[name]) map[name] = { name, total: 0, count: 0 }
    map[name].total += Number(i.price) || 0
    map[name].count += 1
  }
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
})

const maxClient = computed(() => Math.max(1, ...topClients.value.map(c => c.total)))

/** Materiales con poco stock */
const lowStock = computed(() =>
  [...materials.materials]
    .filter(m => Number(m.stock) > 0 && Number(m.stock) <= (Number(m.minStock) || 0))
    .slice(0, 5)
)

/** Máquinas que necesitan atención */
const attention = computed(() =>
  machines.machines.filter(m => m.status === 'averiada' || m.status === 'mantenimiento')
)

function monthLabel(key) {
  const [y, m] = key.split('-')
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${names[Number(m) - 1]} ${y.slice(2)}`
}
</script>

<template>
  <div class="space-y-5">

    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Ingresos del mes" :value="settings.format(monthTotal)" color="emerald"
        icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <StatCard label="Prendas registradas" :value="items.stats.total" color="indigo"
        icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      <StatCard label="Sucursales" :value="scopedBranches.length" color="violet"
        icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      <StatCard label="Empleados" :value="employees.stats.total" color="sky"
        icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </section>

    <!-- Ingresos por mes -->
    <section class="card p-6">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="font-semibold text-slate-900">Ingresos por mes</h2>
          <p class="text-sm text-slate-500">Evolución de los ingresos cobrados</p>
        </div>
        <select v-model.number="months" class="input w-auto min-w-36">
          <option :value="6">Últimos 6 meses</option>
          <option :value="12">Últimos 12 meses</option>
        </select>
      </div>

      <div v-if="!trend.length" class="text-center py-10 text-slate-400 text-sm">Sin ingresos registrados.</div>

      <div v-else class="space-y-3">
        <div v-for="t in trend" :key="t.month" class="flex items-center gap-3">
          <span class="w-16 text-xs text-slate-500 shrink-0">{{ monthLabel(t.month) }}</span>
          <div class="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
            <div
              class="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-lg transition-all duration-500 flex items-center justify-end px-2"
              :style="{ width: Math.max(2, Math.round((t.total / maxTrend) * 100)) + '%' }"
            >
              <span class="text-[10px] font-semibold text-white">{{ settings.format(t.total) }}</span>
            </div>
          </div>
          <span class="w-20 text-right text-xs text-slate-500">{{ t.count }} prenda(s)</span>
        </div>
      </div>
    </section>

    <div class="grid lg:grid-cols-2 gap-5">

      <!-- Por sucursal -->
      <section class="card p-6">
        <h2 class="font-semibold text-slate-900 mb-1">Ingresos por sucursal</h2>
        <p class="text-sm text-slate-500 mb-5">Del mes en curso</p>

        <div v-if="!byBranch.length" class="text-center py-8 text-slate-400 text-sm">Sin sucursales registradas.</div>

        <ul v-else class="space-y-4">
          <li v-for="row in byBranch" :key="row.branch.id" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-indigo-50 grid place-items-center shrink-0">🏪</div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-800 truncate">{{ row.branch.name }}</p>
              <p class="text-xs text-slate-500 truncate">
                {{ row.items }} prenda(s) · {{ row.employees }} empleado(s)
              </p>
            </div>
            <p class="font-semibold text-emerald-600 text-sm shrink-0">{{ settings.format(row.total) }}</p>
          </li>
        </ul>
      </section>

      <!-- Top clientes -->
      <section class="card p-6">
        <h2 class="font-semibold text-slate-900 mb-1">Mejores clientes</h2>
        <p class="text-sm text-slate-500 mb-5">Por ingresos acumulados</p>

        <div v-if="!topClients.length" class="text-center py-8 text-slate-400 text-sm">Sin cobros registrados.</div>

        <ul v-else class="space-y-4">
          <li v-for="c in topClients" :key="c.name">
            <div class="flex items-center justify-between text-sm mb-1.5">
              <span class="text-slate-700 truncate">{{ c.name }}</span>
              <span class="font-medium text-slate-900 shrink-0">{{ settings.format(c.total) }}</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full"
                :style="{ width: Math.max(3, Math.round((c.total / maxClient) * 100)) + '%' }" />
            </div>
            <p class="text-xs text-slate-400 mt-1">{{ c.count }} prenda(s) cobrada(s)</p>
          </li>
        </ul>
      </section>

      <!-- Estados -->
      <section class="card p-6">
        <h2 class="font-semibold text-slate-900 mb-1">Prendas por estado</h2>
        <p class="text-sm text-slate-500 mb-5">Situación actual del flujo</p>
        <ul class="space-y-3">
          <li v-for="s in byStatus" :key="s.id" class="flex items-center justify-between text-sm">
            <span class="text-slate-700">{{ s.label }}</span>
            <span class="font-semibold text-slate-900">{{ s.count }}</span>
          </li>
        </ul>
      </section>

      <!-- Categorías + alertas -->
      <section class="card p-6 space-y-6">
        <div>
          <h2 class="font-semibold text-slate-900 mb-1">Prendas por categoría</h2>
          <p class="text-sm text-slate-500 mb-4">Volumen por tipo de prenda</p>
          <div v-if="!byCategory.length" class="text-slate-400 text-sm">Sin datos.</div>
          <ul v-else class="space-y-2.5">
            <li v-for="c in byCategory" :key="c.id" class="flex items-center justify-between text-sm">
              <span class="text-slate-700">{{ c.icon }} {{ c.label }}</span>
              <span class="font-semibold text-slate-900">{{ c.count }}</span>
            </li>
          </ul>
        </div>

        <div class="pt-4 border-t border-slate-100 space-y-4">
          <div>
            <h3 class="text-sm font-semibold text-slate-800 mb-2">Requieren atención</h3>
            <ul class="space-y-2 text-sm">
              <li class="flex items-center justify-between">
                <span class="text-slate-600">Máquinas averiadas o en mantenimiento</span>
                <span class="font-semibold text-amber-600">{{ attention.length }}</span>
              </li>
              <li class="flex items-center justify-between">
                <span class="text-slate-600">Materiales con stock bajo</span>
                <span class="font-semibold text-rose-600">{{ lowStock.length }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
