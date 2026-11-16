<script setup>
import { ref, computed } from 'vue'
import { useMaterialsStore } from '@/stores/materials.js'
import { useSettingsStore } from '@/stores/settings'

const store = useMaterialsStore()
const settings = useSettingsStore()

const search = ref('')
const filterMaterial = ref('all')
const filterType = ref('all')
const dateFrom = ref('')
const dateTo = ref('')

const filtered = computed(() => {
  let list = store.allMovements

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(mv =>
      (mv.materialName || '').toLowerCase().includes(q) ||
      (mv.materialCode || '').toLowerCase().includes(q) ||
      (mv.supplier || '').toLowerCase().includes(q) ||
      (mv.note || '').toLowerCase().includes(q)
    )
  }
  if (filterMaterial.value !== 'all') list = list.filter(mv => mv.materialId === filterMaterial.value)
  if (filterType.value === 'entrada') list = list.filter(mv => mv.type === 'entrada')
  if (filterType.value === 'salida') list = list.filter(mv => mv.type === 'salida')

  // búsqueda por fecha (rango)
  if (dateFrom.value) list = list.filter(mv => (mv.date || '') >= dateFrom.value)
  if (dateTo.value) list = list.filter(mv => (mv.date || '') <= dateTo.value)

  return list
})

const totals = computed(() => {
  const inList = filtered.value.filter(mv => mv.type === 'entrada')
  const outList = filtered.value.filter(mv => mv.type === 'salida')
  return {
    inQty: inList.reduce((s, mv) => s + (Number(mv.quantity) || 0), 0),
    outQty: outList.reduce((s, mv) => s + (Number(mv.quantity) || 0), 0),
    inValue: inList.reduce((s, mv) => s + (Number(mv.subtotal) || 0), 0),
    outValue: outList.reduce((s, mv) => s + (Number(mv.subtotal) || 0), 0)
  }
})

function clearFilters() {
  search.value = ''
  filterMaterial.value = 'all'
  filterType.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
}

/* ====== Rangos rápidos ====== */
function iso(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function setRange(range) {
  const today = new Date()
  const to = iso(today)

  if (range === 'hoy') {
    dateFrom.value = to
    dateTo.value = to
    return
  }
  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30
    const from = new Date(today)
    from.setDate(from.getDate() - days)
    dateFrom.value = iso(from)
    dateTo.value = to
    return
  }
  if (range === 'mes') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1)
    dateFrom.value = iso(from)
    dateTo.value = to
    return
  }
  clearFilters()
}

const ranges = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: 'mes', label: 'Este mes' },
  { id: 'todo', label: 'Todo' }
]

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
</script>

<template>
  <div class="space-y-4">
    <!-- Resumen -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-xs text-slate-500 uppercase tracking-wide">Entradas</p>
        <p class="mt-1 text-xl font-bold text-emerald-600">{{ totals.inQty }}</p>
        <p class="text-xs text-slate-500 mt-0.5">{{ settings.format(totals.inValue) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-500 uppercase tracking-wide">Salidas</p>
        <p class="mt-1 text-xl font-bold text-rose-600">{{ totals.outQty }}</p>
        <p class="text-xs text-slate-500 mt-0.5">{{ settings.format(totals.outValue) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-500 uppercase tracking-wide">Movimientos</p>
        <p class="mt-1 text-xl font-bold text-slate-900">{{ filtered.length }}</p>
        <p class="text-xs text-slate-500 mt-0.5">en el filtro actual</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-500 uppercase tracking-wide">Invertido (todo)</p>
        <p class="mt-1 text-xl font-bold text-indigo-600">{{ settings.format(store.movementStats.inValue) }}</p>
        <p class="text-xs text-slate-500 mt-0.5">en compras registradas</p>
      </div>
    </section>

    <!-- Filtros -->
    <div class="card p-4 space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 min-w-0">
        <div class="relative xl:col-span-2 min-w-0">
          <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
          </svg>
          <input v-model="search" placeholder="Buscar material, proveedor o nota..." class="input pl-10 w-full" />
        </div>

        <select v-model="filterMaterial" class="input w-full min-w-0">
          <option value="all">Todos los materiales</option>
          <option v-for="m in store.materials" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>

        <select v-model="filterType" class="input w-full min-w-0">
          <option value="all">Entradas y salidas</option>
          <option value="entrada">Solo entradas</option>
          <option value="salida">Solo salidas</option>
        </select>
      </div>

      <div class="flex flex-col xl:flex-row xl:items-center gap-3 min-w-0">
        <div class="grid grid-cols-2 sm:flex sm:items-center sm:gap-2 min-w-0 flex-1 xl:max-w-md">
          <input v-model="dateFrom" type="date" class="input w-full min-w-0" title="Desde" />
          <span class="hidden sm:inline text-slate-400 text-xs">→</span>
          <input v-model="dateTo" type="date" class="input w-full min-w-0" title="Hasta" />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-slate-500 mr-1">Rango rápido:</span>
          <button
            v-for="r in ranges"
            :key="r.id"
            @click="setRange(r.id)"
            :class="[
              'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
              (r.id === 'hoy' && dateFrom === iso(new Date()) && dateTo === iso(new Date())) ||
              (r.id === 'todo' && !dateFrom && !dateTo)
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            ]"
          >
            {{ r.label }}
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500">
          {{ filtered.length }} movimiento(s) · {{ formatDate(dateFrom) }} → {{ formatDate(dateTo) }}
        </p>
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
              <th class="px-4 py-3 font-medium">Material</th>
              <th class="px-4 py-3 font-medium">Tipo</th>
              <th class="px-4 py-3 font-medium text-right">Cantidad</th>
              <th class="px-4 py-3 font-medium">Proveedor</th>
              <th class="px-4 py-3 font-medium text-right">P. unitario</th>
              <th class="px-4 py-3 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="mv in filtered" :key="mv.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 whitespace-nowrap text-slate-700">{{ formatDate(mv.date) }}</td>
              <td class="px-4 py-3">
                <p class="font-medium text-slate-900">{{ mv.materialName }}</p>
                <p class="text-xs text-slate-500">{{ mv.materialCode }}</p>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
                    mv.type === 'entrada'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-rose-50 text-rose-700 ring-rose-200'
                  ]"
                >
                  {{ mv.type === 'entrada' ? 'Entrada' : 'Salida' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <span :class="mv.type === 'entrada' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'">
                  {{ mv.type === 'entrada' ? '+' : '−' }}{{ mv.quantity }} {{ mv.unit }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ mv.supplier || '—' }}</td>
              <td class="px-4 py-3 text-right whitespace-nowrap text-slate-600">
                {{ settings.format(mv.unitPrice) }}
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap font-semibold text-slate-900">
                {{ settings.format(mv.subtotal) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-12 text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-linear-to-tr from-sky-100 to-cyan-100 grid place-items-center text-2xl mb-4">📋</div>
        <h3 class="font-semibold text-slate-900">Sin movimientos</h3>
        <p class="text-sm text-slate-500 mt-1">
          Registra compras con «+ Agregar stock» para ver el historial de ingresos.
        </p>
      </div>
    </div>
  </div>
</template>
