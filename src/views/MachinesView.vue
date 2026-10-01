<script setup>
import { ref, computed } from 'vue'
import { useMachinesStore, MACHINE_TYPES, MACHINE_STATUSES } from '@/stores/machines.js'
import MachineFormModal from '@/components/MachineFormModal.vue'
import StatCard from '@/components/StatCard.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { formatDate } from '@/utils/format'

import InlineEdit from '@/components/InlineEdit.vue'
import QuickStatusSelect from '@/components/QuickStatusSelect.vue'

function updateField(id, field, value) {
  store.updateMachine(id, { [field]: value })
}

const store = useMachinesStore()
const toast = useToast()
const { confirm } = useConfirm()

const search = ref('')
const filterType = ref('all')
const filterStatus = ref('all')
const modalOpen = ref(false)
const editing = ref(null)
const detailOpen = ref(false)
const selected = ref(null)

const filtered = computed(() => {
  let list = store.machines
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      (m.brand || '').toLowerCase().includes(q) ||
      (m.model || '').toLowerCase().includes(q)
    )
  }
  if (filterType.value !== 'all') list = list.filter(m => m.type === filterType.value)
  if (filterStatus.value !== 'all') list = list.filter(m => m.status === filterStatus.value)
  return list
})

function openCreate() { editing.value = null; modalOpen.value = true }
function openEdit(item) { editing.value = item; modalOpen.value = true }
function openDetail(item) { selected.value = item; detailOpen.value = true }

async function handleDelete(id) {
  const item = store.getById(id)
  const ok = await confirm({
    title: 'Eliminar máquina',
    message: `¿Eliminar "${item?.name}"?`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (ok) {
    store.removeMachine(id)
    toast.success('Máquina eliminada')
  }
}

function changeStatus(id, status) {
  store.updateMachine(id, { status })
  toast.info(`Estado cambiado a ${MACHINE_STATUSES.find(s => s.id === status)?.label}`)
}

function clearFilters() {
  search.value = ''
  filterType.value = 'all'
  filterStatus.value = 'all'
}

const typeIcon = (id) => MACHINE_TYPES.find(t => t.id === id)?.icon || '⚙️'
const typeLabel = (id) => MACHINE_TYPES.find(t => t.id === id)?.label || id

const statusStyles = {
  operativa: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  mantenimiento: 'bg-amber-50 text-amber-700 ring-amber-200',
  averiada: 'bg-rose-50 text-rose-700 ring-rose-200',
  inactiva: 'bg-slate-100 text-slate-600 ring-slate-200'
}
</script>

<template>
  <div class="space-y-5">
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total máquinas" :value="store.stats.total" color="indigo"
        icon="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      <StatCard label="Operativas" :value="store.stats.operativa" color="emerald"
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      <StatCard label="Mantenimiento" :value="store.stats.mantenimiento" color="amber"
        icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <StatCard label="Averiadas" :value="store.stats.averiada" color="rose"
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </section>

    <div class="card p-4 flex flex-col lg:flex-row gap-3">
      <div class="relative flex-1">
        <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
        </svg>
        <input v-model="search" placeholder="Buscar máquina..." class="input pl-10" />
      </div>
      <select v-model="filterType" class="input w-auto min-w-40">
        <option value="all">Todos los tipos</option>
        <option v-for="t in MACHINE_TYPES" :key="t.id" :value="t.id">{{ t.icon }} {{ t.label }}</option>
      </select>
      <select v-model="filterStatus" class="input w-auto min-w-40">
        <option value="all">Todos los estados</option>
        <option v-for="s in MACHINE_STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
      </select>
      <button @click="openCreate" class="btn-primary shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Nueva máquina
      </button>
    </div>

    <div v-if="filtered.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
  <div v-for="m in filtered" :key="m.id" class="card p-5 flex flex-col gap-3 hover:shadow-md transition">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="w-11 h-11 rounded-xl bg-slate-100 grid place-items-center text-xl shrink-0">
          {{ typeIcon(m.type) }}
        </div>
        <div class="min-w-0 flex-1">
          <InlineEdit
            :model-value="m.name"
            @update:model-value="v => updateField(m.id, 'name', v)"
            class="font-semibold text-slate-900 block truncate"
          />
          <p class="text-xs text-slate-500">{{ m.code }} · {{ typeLabel(m.type) }}</p>
        </div>
      </div>
      <QuickStatusSelect
        :model-value="m.status"
        :options="MACHINE_STATUSES.map(s => ({ id: s.id, label: s.label, color: s.color }))"
        @update:model-value="v => changeStatus(m.id, v)"
      />
    </div>

    <div class="text-sm text-slate-600 space-y-1.5">
      <div class="flex items-center gap-1">
        <span class="text-slate-400 shrink-0">Modelo:</span>
        <InlineEdit
          :model-value="[m.brand, m.model].filter(Boolean).join(' ')"
          placeholder="Marca / modelo..."
          @update:model-value="v => {
            const [brand, ...rest] = (v || '').split(' ');
            updateField(m.id, 'brand', brand);
            updateField(m.id, 'model', rest.join(' '));
          }"
        >
          <span v-if="m.brand || m.model" class="truncate">{{ m.brand }} {{ m.model }}</span>
          <span v-else class="text-slate-300 italic text-xs">+ Añadir marca y modelo</span>
        </InlineEdit>
      </div>

      <div class="flex items-center gap-1">
        <span class="text-slate-400 shrink-0">Ubicación:</span>
        <InlineEdit
          :model-value="m.location"
          placeholder="Ubicación..."
          @update:model-value="v => updateField(m.id, 'location', v)"
        >
          <span v-if="m.location" class="truncate">{{ m.location }}</span>
          <span v-else class="text-slate-300 italic text-xs">+ Sin ubicación</span>
        </InlineEdit>
      </div>

      <p v-if="m.nextMaintenance" class="text-slate-500 text-xs">
        <span class="text-slate-400">Próx. mant.:</span> {{ formatDate(m.nextMaintenance) }}
      </p>
    </div>

    <div class="flex items-center gap-2 pt-3 border-t border-slate-100 mt-auto">
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
      <div class="w-16 h-16 mx-auto rounded-2xl bg-linear-to-tr from-indigo-100 to-violet-100 grid place-items-center text-2xl mb-4">⚙️</div>
      <h3 class="font-semibold text-slate-900">{{ store.stats.total ? 'Sin resultados' : 'Sin máquinas registradas' }}</h3>
      <p class="text-sm text-slate-500 mt-1 mb-5">
        {{ store.stats.total ? 'Prueba con otros filtros.' : 'Registra lavadoras, secadoras, planchas...' }}
      </p>
      <button v-if="!store.stats.total" @click="openCreate" class="btn-primary">Crear primera máquina</button>
      <button v-else @click="clearFilters" class="btn-ghost">Limpiar filtros</button>
    </div>

    <MachineFormModal v-model="modalOpen" :item="editing" />
  </div>
</template>