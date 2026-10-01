<script setup>
import { ref, computed } from 'vue'
import { useMaterialsStore, MATERIAL_CATEGORIES } from '@/stores/materials'
import MaterialFormModal from '@/components/MaterialFormModal.vue'
import StatCard from '@/components/StatCard.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { formatMoney } from '@/utils/format'
import InlineEdit from '@/components/InlineEdit.vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()

function updateField(id, field, value) {
  store.updateMaterial(id, { [field]: value })
}

const store = useMaterialsStore()
const toast = useToast()
const { confirm } = useConfirm()

const search = ref('')
const filterCategory = ref('all')
const filterStock = ref('all')
const modalOpen = ref(false)
const editing = ref(null)

const filtered = computed(() => {
  let list = store.materials
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      (m.supplier || '').toLowerCase().includes(q)
    )
  }
  if (filterCategory.value !== 'all') list = list.filter(m => m.category === filterCategory.value)
  if (filterStock.value === 'low') list = list.filter(m => m.stock <= (m.minStock || 0))
  if (filterStock.value === 'ok') list = list.filter(m => m.stock > (m.minStock || 0))
  return list
})

function openCreate() { editing.value = null; modalOpen.value = true }
function openEdit(item) { editing.value = item; modalOpen.value = true }

async function handleDelete(id) {
  const item = store.getById(id)
  const ok = await confirm({
    title: 'Eliminar material',
    message: `¿Eliminar "${item?.name}"?`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (ok) {
    store.removeMaterial(id)
    toast.success('Material eliminado')
  }
}

function adjust(id, delta) {
  store.adjustStock(id, delta)
  const m = store.getById(id)
  toast.info(`${m.name}: ${m.stock} ${m.unit}`)
}

function clearFilters() {
  search.value = ''
  filterCategory.value = 'all'
  filterStock.value = 'all'
}

const catIcon = (id) => MATERIAL_CATEGORIES.find(c => c.id === id)?.icon || '📦'
const catLabel = (id) => MATERIAL_CATEGORIES.find(c => c.id === id)?.label || id
</script>

<template>
  <div class="space-y-5">
    <!-- KPIs -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Materiales" :value="store.stats.total" color="sky"
        icon="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      <StatCard label="Stock bajo" :value="store.stats.lowStock" color="rose"
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      <StatCard label="Categorías" :value="store.stats.categories" color="violet"
        icon="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      <StatCard label="Valor inventario" :value="settings.format(store.stats.totalValue)" color="emerald"
        icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </section>

    <!-- Alerta stock bajo -->
    <div v-if="store.lowStockItems.length" class="card p-4 border-rose-200 bg-rose-50/60 flex items-start gap-3">
      <svg class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <div class="flex-1 text-sm">
        <p class="font-semibold text-rose-900">
          {{ store.lowStockItems.length }} material{{ store.lowStockItems.length > 1 ? 'es' : '' }} con stock bajo
        </p>
        <p class="text-rose-700 mt-0.5">
          {{ store.lowStockItems.map(m => m.name).join(', ') }}
        </p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card p-4 flex flex-col lg:flex-row gap-3">
      <div class="relative flex-1">
        <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
        </svg>
        <input v-model="search" placeholder="Buscar material..." class="input pl-10" />
      </div>
      <select v-model="filterCategory" class="input w-auto min-w-[160px]">
        <option value="all">Todas categorías</option>
        <option v-for="c in MATERIAL_CATEGORIES" :key="c.id" :value="c.id">{{ c.icon }} {{ c.label }}</option>
      </select>
      <select v-model="filterStock" class="input w-auto min-w-[140px]">
        <option value="all">Todo stock</option>
        <option value="low">Stock bajo</option>
        <option value="ok">Stock OK</option>
      </select>
      <button @click="openCreate" class="btn-primary shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Nuevo material
      </button>
    </div>

    <!-- Lista -->
    <div v-if="filtered.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
  <div v-for="m in filtered" :key="m.id" class="card p-5 flex flex-col gap-3 hover:shadow-md transition">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="w-11 h-11 rounded-xl bg-slate-100 grid place-items-center text-xl shrink-0">
          {{ catIcon(m.category) }}
        </div>
        <div class="min-w-0 flex-1">
          <InlineEdit
            :model-value="m.name"
            @update:model-value="v => updateField(m.id, 'name', v)"
            class="font-semibold text-slate-900 block truncate"
          />
          <p class="text-xs text-slate-500">{{ m.code }} · {{ catLabel(m.category) }}</p>
        </div>
      </div>
      <span
        :class="[
          'px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset shrink-0',
          m.stock <= (m.minStock || 0)
            ? 'bg-rose-50 text-rose-700 ring-rose-200'
            : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        ]"
      >
        {{ m.stock <= (m.minStock || 0) ? 'Stock bajo' : 'Stock OK' }}
      </span>
    </div>

    <div class="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-100">
      <div>
        <InlineEdit
          :model-value="m.stock"
          type="number"
          :min="0"
          :step="0.1"
          align="center"
          @update:model-value="v => updateField(m.id, 'stock', Number(v))"
          class="text-lg font-bold text-slate-900 block w-full"
        />
        <p class="text-xs text-slate-500">{{ m.unit }}</p>
      </div>
      <div>
        <InlineEdit
          :model-value="m.minStock"
          type="number"
          :min="0"
          :step="0.1"
          align="center"
          @update:model-value="v => updateField(m.id, 'minStock', Number(v))"
          class="text-lg font-bold text-slate-900 block w-full"
        />
        <p class="text-xs text-slate-500">mínimo</p>
      </div>
      <div>
        <div class="text-lg font-bold text-slate-900 inline-flex items-center justify-center gap-0.5 w-full">
          <span class="text-slate-400 text-[10px] uppercase">{{ settings.current.symbol }}</span>
          <InlineEdit
            :model-value="m.price || 0"
            type="number"
            :min="0"
            :step="0.01"
            align="center"
            @update:model-value="v => updateField(m.id, 'price', Number(v))"
          />
        </div>
        <p class="text-xs text-slate-500">precio</p>
      </div>
    </div>

    <InlineEdit
      :model-value="m.supplier"
      placeholder="Proveedor..."
      @update:model-value="v => updateField(m.id, 'supplier', v)"
      class="text-xs text-slate-500"
    >
      <span v-if="m.supplier">🏭 {{ m.supplier }}</span>
      <span v-else class="text-slate-300 italic">+ Proveedor</span>
    </InlineEdit>

    <div class="flex items-center gap-2 pt-2 mt-auto">
      <div class="flex items-center gap-1">
        <button @click="adjust(m.id, -1)" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold">−</button>
        <button @click="adjust(m.id, +1)" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold">+</button>
      </div>
      <button @click="openEdit(m)" class="btn-ghost text-xs p-2 ml-auto" title="Editar todo">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
      </button>
      <button @click="handleDelete(m.id)" class="btn-ghost text-xs text-rose-500 hover:bg-rose-50 p-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"/></svg>
      </button>
    </div>
  </div>
</div>

    <div v-else class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-sky-100 to-cyan-100 grid place-items-center text-2xl mb-4">🧴</div>
      <h3 class="font-semibold text-slate-900">{{ store.stats.total ? 'Sin resultados' : 'Sin materiales registrados' }}</h3>
      <p class="text-sm text-slate-500 mt-1 mb-5">
        {{ store.stats.total ? 'Prueba con otros filtros.' : 'Añade detergentes, suavizantes y productos de limpieza.' }}
      </p>
      <button v-if="!store.stats.total" @click="openCreate" class="btn-primary">Crear primer material</button>
      <button v-else @click="clearFilters" class="btn-ghost">Limpiar filtros</button>
    </div>

    <MaterialFormModal v-model="modalOpen" :item="editing" />
  </div>
</template>