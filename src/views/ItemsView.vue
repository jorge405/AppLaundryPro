<script setup>
import { ref, computed } from 'vue'
import { useItemsStore, CATEGORIES, STATUSES } from '@/stores/items'
import ItemCard from '@/components/ItemCard.vue'
import ItemFormModal from '@/components/ItemFormModal.vue'
import ItemViewModal from '@/components/ItemViewModal.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const items = useItemsStore()
const toast = useToast()
const { confirm } = useConfirm()

const search = ref('')
const filterCategory = ref('all')
const filterStatus = ref('all')
const sortBy = ref('recent')

// Modales
const formModalOpen = ref(false)
const viewModalOpen = ref(false)
const selectedItem = ref(null)       // Para editar
const viewingItem = ref(null)        // Para ver

const filtered = computed(() => {
  let list = items.items
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q) ||
      (i.notes || '').toLowerCase().includes(q)
    )
  }
  if (filterCategory.value !== 'all') list = list.filter(i => i.category === filterCategory.value)
  if (filterStatus.value !== 'all') list = list.filter(i => i.status === filterStatus.value)

  const sorted = [...list]
  if (sortBy.value === 'recent') sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  if (sortBy.value === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
  if (sortBy.value === 'price') sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
  return sorted
})

/* ===== Acciones ===== */
function openCreate() {
  selectedItem.value = null
  formModalOpen.value = true
}

function openEdit(item) {
  selectedItem.value = item
  viewModalOpen.value = false   // cierra el view si estaba abierto
  formModalOpen.value = true
}

function openView(item) {
  viewingItem.value = item
  viewModalOpen.value = true
}

// Cuando desde el modal de Ver pulsan "Editar prenda"
function onViewEdit(item) {
  openEdit(item)
}

async function handleDelete(id) {
  const item = items.getById(id)
  const ok = await confirm({
    title: 'Eliminar prenda',
    message: `¿Seguro que quieres eliminar "${item?.name}"? Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (ok) {
    items.removeItem(id)
    toast.success('Prenda eliminada')
  }
}

function handleAdvance(id) {
  items.advanceStatus(id)
  const item = items.getById(id)
  toast.info(`${item.name} → ${STATUSES.find(s => s.id === item.status)?.label}`)
}

function clearFilters() {
  search.value = ''
  filterCategory.value = 'all'
  filterStatus.value = 'all'
}
</script>

<template>
  <div class="space-y-5">
    <!-- Barra acciones -->
    <div class="card p-4 flex flex-col lg:flex-row gap-3">
      <div class="relative flex-1">
        <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
        </svg>
        <input v-model="search" placeholder="Buscar por nombre, código o nota..." class="input pl-10" />
      </div>
      <div class="flex flex-wrap gap-2">
        <select v-model="filterCategory" class="input w-auto min-w-[140px]">
          <option value="all">Todas categorías</option>
          <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.icon }} {{ c.label }}</option>
        </select>
        <select v-model="filterStatus" class="input w-auto min-w-[140px]">
          <option value="all">Todos estados</option>
          <option v-for="s in STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
        <select v-model="sortBy" class="input w-auto min-w-[130px]">
          <option value="recent">Recientes</option>
          <option value="name">Nombre</option>
          <option value="price">Precio</option>
        </select>
        <button @click="openCreate" class="btn-primary shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          Nueva
        </button>
      </div>
    </div>

    <!-- Contador -->
    <div class="flex items-center justify-between text-sm">
      <p class="text-slate-500">
        <span class="font-medium text-slate-800">{{ filtered.length }}</span> de {{ items.stats.total }} prendas
      </p>
      <button v-if="search || filterCategory !== 'all' || filterStatus !== 'all'" @click="clearFilters" class="text-indigo-600 hover:text-indigo-700 font-medium">
        Limpiar filtros
      </button>
    </div>

    <!-- Grid -->
    <div v-if="filtered.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <ItemCard
        v-for="item in filtered"
        :key="item.id"
        :item="item"
        @view="openView"
        @edit="openEdit"
        @delete="handleDelete"
        @advance="handleAdvance"
      />
    </div>

    <!-- Vacío -->
    <div v-else class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-100 to-violet-100 grid place-items-center text-2xl mb-4">🧺</div>
      <h3 class="font-semibold text-slate-900">{{ items.stats.total ? 'Sin resultados' : 'Empieza tu primera prenda' }}</h3>
      <p class="text-sm text-slate-500 mt-1 mb-5">
        {{ items.stats.total ? 'Prueba con otros filtros de búsqueda.' : 'Registra trajes, camas y ropa para comenzar a gestionar.' }}
      </p>
      <button v-if="!items.stats.total" @click="openCreate" class="btn-primary">Crear primera prenda</button>
      <button v-else @click="clearFilters" class="btn-ghost">Limpiar filtros</button>
    </div>

    <!-- Modales -->
    <ItemFormModal v-model="formModalOpen" :item="selectedItem" />
    <ItemViewModal
      v-model="viewModalOpen"
      :item="viewingItem"
      @edit="onViewEdit"
    />
  </div>
</template>