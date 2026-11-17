<script setup>
import { ref, computed } from 'vue'
import { useItemsStore, CATEGORIES, STATUSES } from '@/stores/Items'
import { useAuthStore } from '@/stores/auth'
import { useBranchesStore } from '@/stores/branches'
import { useSettingsStore } from '@/stores/settings'
import ItemCard from '@/components/ItemCard.vue'
import ItemFormModal from '@/components/ItemFormModal.vue'
import ItemViewModal from '@/components/ItemViewModal.vue'
import ItemReceiptModal from '@/components/ItemReceiptModal.vue'
import BranchGroupCard from '@/components/BranchGroupCard.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const items = useItemsStore()
const auth = useAuthStore()
const branches = useBranchesStore()
const settings = useSettingsStore()
const toast = useToast()
const { confirm } = useConfirm()

/** El administrador del negocio solo consulta prendas */
const canCreate = computed(() => auth.can('items.create'))
const canEdit = computed(() => auth.can('items.edit'))

const search = ref('')
const filterCategory = ref('all')
const filterStatus = ref('all')
const filterView = ref('activos')
const filterBranch = ref('all')
const sortBy = ref('recent')

// Modales
const formModalOpen = ref(false)
const viewModalOpen = ref(false)
const receiptModalOpen = ref(false)

const selectedItem = ref(null)   // editar
const viewingItem = ref(null)    // ver
const receiptItem = ref(null)    // comprobante

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
  if (filterBranch.value !== 'all') list = list.filter(i => i.branchId === filterBranch.value)
  if (filterView.value === 'activos') list = list.filter(i => !i.cancelled && !i.archived)
  if (filterView.value === 'cancelados') list = list.filter(i => i.cancelled)
  if (filterView.value === 'archivados') list = list.filter(i => i.archived)

  const sorted = [...list]
  if (sortBy.value === 'recent') sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  if (sortBy.value === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
  if (sortBy.value === 'price') sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
  return sorted
})

/** Agrupa las prendas por sucursal (incluye un grupo "Sin sucursal") */
const groups = computed(() => {
  const map = new Map()
  for (const item of filtered.value) {
    const key = item.branchId || '__none__'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return [...map.entries()]
    .map(([key, list]) => {
      const branch = key === '__none__' ? null : branches.getById(key)
      const total = list.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)
      const enProceso = list.filter(i => i.status !== 'cobrado' && i.status !== 'listo').length
      const listas = list.filter(i => i.status === 'listo' || i.status === 'cobrado').length
      return {
        key,
        branch,
        list,
        name: branch?.name || 'Sin sucursal',
        subtitle: branch
          ? [branch.manager, branch.address].filter(Boolean).join(' · ') || 'Sin datos de la sucursal'
          : 'Prendas sin asignar a ninguna sucursal',
        stats: [
          { label: 'prendas', value: list.length },
          { label: 'total', value: settings.format(total), tone: 'text-emerald-600' },
          { label: 'en proceso', value: enProceso, tone: 'text-sky-600' },
          { label: 'listas', value: listas, tone: 'text-indigo-600' }
        ]
      }
    })
    .sort((a, b) => b.list.length - a.list.length)
})

/* ===== Acciones ===== */
function openCreate() {
  selectedItem.value = null
  formModalOpen.value = true
}

function openEdit(item) {
  selectedItem.value = item
  viewModalOpen.value = false
  receiptModalOpen.value = false
  formModalOpen.value = true
}

function openView(item) {
  viewingItem.value = item
  viewModalOpen.value = true
}

// 🧾 Abrir modal de comprobante
function openReceipt(item) {
  receiptItem.value = item
  receiptModalOpen.value = true
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
  const item = items.getById(id)
  const res = items.advanceStatus(id)
  if (res?.blocked) {
    toast.error('Prenda bloqueada: ya está cobrada o entregada')
    return
  }
  const updated = items.getById(id)
  toast.info(`${updated.name} → ${STATUSES.find(s => s.id === updated.status)?.label}`)
}

function clearFilters() {
  search.value = ''
  filterCategory.value = 'all'
  filterStatus.value = 'all'
  filterView.value = 'activos'
  filterBranch.value = 'all'
}

/* ===== Cancelar / archivar ===== */
async function handleCancel(item) {
  const ok = await confirm({
    title: 'Cancelar prenda',
    message: `¿Cancelar "${item.name}"? No se borra, queda registrada como cancelada y puedes reactivarla.`,
    confirmText: 'Cancelar prenda',
    danger: true
  })
  if (!ok) return
  items.cancelItem(item.id)
  toast.success('Prenda cancelada')
}

function handleReactivate(item) {
  items.reactivateItem(item.id)
  toast.success('Prenda reactivada')
}

async function handleArchive(item) {
  const ok = await confirm({
    title: 'Archivar prenda',
    message: `¿Archivar "${item.name}"? Dejará de aparecer en la lista de prendas activas.`,
    confirmText: 'Archivar'
  })
  if (!ok) return
  items.archiveItem(item.id)
  toast.success('Prenda archivada')
}

function handleUnarchive(item) {
  items.unarchiveItem(item.id)
  toast.success('Prenda desarchivada')
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
        <select v-model="filterView" data-view-filter="1" class="input w-auto min-w-[140px]">
          <option value="activos">Activos</option>
          <option value="cancelados">Cancelados</option>
          <option value="archivados">Archivados</option>
          <option value="todos">Todos</option>
        </select>
        <select v-model="filterBranch" class="input w-auto min-w-[150px]">
          <option value="all">Todas las sucursales</option>
          <option v-for="b in branches.list" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
        <select v-model="sortBy" class="input w-auto min-w-[130px]">
          <option value="recent">Recientes</option>
          <option value="name">Nombre</option>
          <option value="price">Precio</option>
        </select>
        <button v-if="canCreate" @click="openCreate" class="btn-primary shrink-0">
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
      <button v-if="search || filterCategory !== 'all' || filterStatus !== 'all' || filterView !== 'activos' || filterBranch !== 'all'" @click="clearFilters" class="text-indigo-600 hover:text-indigo-700 font-medium">
        Limpiar filtros
      </button>
    </div>

    <!-- Tarjetas por sucursal -->
    <div v-if="filtered.length" class="space-y-5">
      <BranchGroupCard
        v-for="g in groups"
        :key="g.key"
        :branch="g.branch"
        :name="g.name"
        :subtitle="g.subtitle"
        :stats="g.stats"
        icon="🧺"
      >
        <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <ItemCard
            v-for="item in g.list"
            :key="item.id"
            :item="item"
            @view="openView"
            @edit="openEdit"
            @view-receipt="openReceipt"
            @delete="handleDelete"
            @advance="handleAdvance"
            @cancel="handleCancel"
            @reactivate="handleReactivate"
            @archive="handleArchive"
            @unarchive="handleUnarchive"
          />
        </div>
      </BranchGroupCard>
    </div>

    <!-- Vacío -->
    <div v-else class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-100 to-violet-100 grid place-items-center text-2xl mb-4">🧺</div>
      <h3 class="font-semibold text-slate-900">{{ items.stats.total ? 'Sin resultados' : 'Empieza tu primera prenda' }}</h3>
      <p class="text-sm text-slate-500 mt-1 mb-5">
        {{ items.stats.total ? 'Prueba con otros filtros de búsqueda.' : 'Registra trajes, camas y ropa para comenzar a gestionar.' }}
      </p>
      <button v-if="!items.stats.total && canCreate" @click="openCreate" class="btn-primary">Crear primera prenda</button>
      <button v-else-if="items.stats.total" @click="clearFilters" class="btn-ghost">Limpiar filtros</button>
    </div>

    <!-- Modales -->
    <ItemFormModal v-model="formModalOpen" :item="selectedItem" />
    <ItemViewModal
      v-model="viewModalOpen"
      :item="viewingItem"
      @edit="onViewEdit"
    />
    <ItemReceiptModal
      v-model="receiptModalOpen"
      :item="receiptItem"
      @charged="() => toast.success('Prenda cobrada')"
    />
  </div>
</template>