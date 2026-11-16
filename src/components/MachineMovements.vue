<script setup>
import { ref, computed } from 'vue'
import { useMachinesStore, MACHINE_STATUSES } from '@/stores/machines.js'
import { useSettingsStore } from '@/stores/settings'

const store = useMachinesStore()
const settings = useSettingsStore()

const search = ref('')
const filterStatus = ref('all')
const dateFrom = ref('')
const dateTo = ref('')

/** Historial plano de movimientos de todas las máquinas */
const movements = computed(() => {
  const list = []
  for (const m of store.machines) {
    for (const h of m.history || []) {
      list.push({
        id: `${m.id}-${h.at}-${h.status}`,
        at: h.at,
        date: (h.at || '').slice(0, 10),
        machineId: m.id,
        machineName: m.name,
        machineCode: m.code,
        type: m.type,
        status: h.status,
        note: h.note,
        maintenance: m.maintenance,
        breakdown: m.breakdown
      })
    }
  }
  return list.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
})

const filtered = computed(() => {
  let list = movements.value
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(mv =>
      (mv.machineName || '').toLowerCase().includes(q) ||
      (mv.machineCode || '').toLowerCase().includes(q) ||
      (mv.note || '').toLowerCase().includes(q) ||
      (mv.maintenance?.supplier || '').toLowerCase().includes(q) ||
      (mv.breakdown?.supplier || '').toLowerCase().includes(q)
    )
  }
  if (filterStatus.value !== 'all') list = list.filter(mv => mv.status === filterStatus.value)
  if (dateFrom.value) list = list.filter(mv => (mv.date || '') >= dateFrom.value)
  if (dateTo.value) list = list.filter(mv => (mv.date || '') <= dateTo.value)
  return list
})

const totals = computed(() => {
  const maint = filtered.value.filter(mv => mv.status === 'mantenimiento')
  const broken = filtered.value.filter(mv => mv.status === 'averiada')
  return {
    maintCost: maint.reduce((s, mv) => s + (Number(mv.maintenance?.cost) || 0), 0),
    repairCost: broken.reduce((s, mv) => s + (Number(mv.breakdown?.cost) || 0), 0)
  }
})

const statusLabel = (id) => MACHINE_STATUSES.find(s => s.id === id)?.label || id

function clearFilters() {
  search.value = ''
  filterStatus.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Resumen -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-xs text-slate-500 uppercase tracking-wide">Movimientos</p>
        <p class="mt-1 text-xl font-bold text-slate-900">{{ filtered.length }}</p>
        <p class="text-xs text-slate-500 mt-0.5">en el filtro actual</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-500 uppercase tracking-wide">Mantenimientos</p>
        <p class="mt-1 text-xl font-bold text-amber-600">
          {{ filtered.filter(mv => mv.status === 'mantenimiento').length }}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-500 uppercase tracking-wide">Costo mant.</p>
        <p class="mt-1 text-xl font-bold text-amber-700">{{ settings.format(totals.maintCost) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-500 uppercase tracking-wide">Costo averías</p>
        <p class="mt-1 text-xl font-bold text-rose-700">{{ settings.format(totals.repairCost) }}</p>
      </div>
    </section>

    <!-- Filtros -->
    <div class="card p-4 space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 min-w-0">
        <div class="relative xl:col-span-2 min-w-0">
          <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
          </svg>
          <input v-model="search" placeholder="Buscar máquina, proveedor o nota..." class="input pl-10 w-full" />
        </div>

        <select v-model="filterStatus" class="input w-full min-w-0">
          <option value="all">Todos los estados</option>
          <option v-for="s in MACHINE_STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>

        <div class="grid grid-cols-2 sm:flex sm:items-center sm:gap-2 min-w-0">
          <input v-model="dateFrom" type="date" class="input w-full min-w-0" title="Desde" />
          <span class="hidden sm:inline text-slate-400 text-xs">→</span>
          <input v-model="dateTo" type="date" class="input w-full min-w-0" title="Hasta" />
        </div>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500">{{ filtered.length }} movimiento(s)</p>
        <button @click="clearFilters" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card overflow-hidden">
      <div v-if="filtered.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th class="px-4 py-3 font-medium">Fecha</th>
              <th class="px-4 py-3 font-medium">Máquina</th>
              <th class="px-4 py-3 font-medium">Estado</th>
              <th class="px-4 py-3 font-medium">Detalle</th>
              <th class="px-4 py-3 font-medium text-right">Costo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="mv in filtered" :key="mv.id" class="hover:bg-slate-50 align-top">
              <td class="px-4 py-3 whitespace-nowrap text-slate-700">{{ formatDate(mv.at) }}</td>
              <td class="px-4 py-3">
                <p class="font-medium text-slate-900">{{ mv.machineName }}</p>
                <p class="text-xs text-slate-500">{{ mv.machineCode }}</p>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset whitespace-nowrap',
                    mv.status === 'operativa' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : mv.status === 'mantenimiento' ? 'bg-amber-50 text-amber-700 ring-amber-200'
                    : mv.status === 'averiada' ? 'bg-rose-50 text-rose-700 ring-rose-200'
                    : 'bg-slate-100 text-slate-600 ring-slate-200'
                  ]"
                >
                  {{ statusLabel(mv.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-slate-600">
                <template v-if="mv.status === 'mantenimiento' && mv.maintenance">
                  <p><span class="text-slate-400">Se dejó:</span> {{ mv.maintenance.sentDate || '—' }} · <span class="text-slate-400">Se recoge:</span> {{ mv.maintenance.pickupDate || '—' }}</p>
                  <p><span class="text-slate-400">Lugar:</span> {{ mv.maintenance.place || '—' }} · <span class="text-slate-400">Proveedor:</span> {{ mv.maintenance.supplier || '—' }}</p>
                  <p v-if="mv.maintenance.notes" class="text-slate-400">{{ mv.maintenance.notes }}</p>
                </template>
                <template v-else-if="mv.status === 'averiada' && mv.breakdown">
                  <p><span class="text-slate-400">Fallo:</span> {{ mv.breakdown.fault || '—' }}</p>
                  <p><span class="text-slate-400">Detectado:</span> {{ mv.breakdown.detectedDate || '—' }} · <span class="text-slate-400">Lugar:</span> {{ mv.breakdown.place || '—' }}</p>
                  <p><span class="text-slate-400">Proveedor:</span> {{ mv.breakdown.supplier || '—' }} · <span class="text-slate-400">En taller:</span> {{ mv.breakdown.inWorkshop ? 'Sí' : 'No' }}</p>
                </template>
                <p v-else class="text-slate-400">{{ mv.note }}</p>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap font-semibold text-slate-900">
                <template v-if="mv.status === 'mantenimiento'">{{ settings.format(mv.maintenance?.cost || 0) }}</template>
                <template v-else-if="mv.status === 'averiada'">{{ settings.format(mv.breakdown?.cost || 0) }}</template>
                <template v-else>—</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-12 text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-linear-to-tr from-indigo-100 to-violet-100 grid place-items-center text-2xl mb-4">🔧</div>
        <h3 class="font-semibold text-slate-900">Sin movimientos</h3>
        <p class="text-sm text-slate-500 mt-1">
          Los cambios de estado de las máquinas quedarán registrados aquí.
        </p>
      </div>
    </div>
  </div>
</template>
