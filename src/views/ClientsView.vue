<script setup>
import { ref, computed } from 'vue'
import { useClientsStore } from '@/stores/clients.js'
import ClientFormModal from '@/components/ClientFormModal.vue'
import StatCard from '@/components/StatCard.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { formatMoney, timeAgo } from '@/utils/format'

const store = useClientsStore()
const toast = useToast()
const { confirm } = useConfirm()

const search = ref('')
const filterTier = ref('all')
const modalOpen = ref(false)
const editing = ref(null)

const filtered = computed(() => {
  let list = store.clients
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }
  if (filterTier.value !== 'all') list = list.filter(c => c.tier === filterTier.value)
  return list
})

function openCreate() { editing.value = null; modalOpen.value = true }
function openEdit(item) { editing.value = item; modalOpen.value = true }

async function handleDelete(id) {
  const item = store.getById(id)
  const ok = await confirm({
    title: 'Eliminar cliente',
    message: `¿Eliminar "${item?.name}"?`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (ok) {
    store.removeClient(id)
    toast.success('Cliente eliminado')
  }
}

function clearFilters() {
  search.value = ''
  filterTier.value = 'all'
}

const tierStyles = {
  nuevo: 'bg-sky-50 text-sky-700 ring-sky-200',
  recurrente: 'bg-violet-50 text-violet-700 ring-violet-200',
  vip: 'bg-amber-50 text-amber-700 ring-amber-200'
}
const tierLabels = { nuevo: 'Nuevo', recurrente: 'Recurrente', vip: 'VIP' }

function initials(name) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<template>
  <div class="space-y-5">
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total clientes" :value="store.stats.total" color="indigo"
        icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      <StatCard label="VIP" :value="store.stats.vip" color="amber"
        icon="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      <StatCard label="Recurrentes" :value="store.stats.recurrentes" color="violet"
        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      <StatCard label="Nuevos" :value="store.stats.nuevos" color="sky"
        icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </section>

    <div class="card p-4 flex flex-col lg:flex-row gap-3">
      <div class="relative flex-1">
        <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
        </svg>
        <input v-model="search" placeholder="Buscar cliente..." class="input pl-10" />
      </div>
      <select v-model="filterTier" class="input w-auto min-w-37.5">
        <option value="all">Todos los tipos</option>
        <option value="nuevo">Nuevos</option>
        <option value="recurrente">Recurrentes</option>
        <option value="vip">VIP</option>
      </select>
      <button @click="openCreate" class="btn-primary shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Nuevo cliente
      </button>
    </div>

    <div v-if="filtered.length" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="c in filtered" :key="c.id" class="card p-5 flex flex-col gap-3 hover:shadow-md transition">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-500 to-violet-500 grid place-items-center text-white font-semibold text-sm shrink-0 shadow-lg shadow-indigo-500/25">
            {{ initials(c.name) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div class="min-w-0">
                <p class="font-semibold text-slate-900 truncate">{{ c.name }}</p>
                <p class="text-xs text-slate-500">{{ c.code }}</p>
              </div>
              <span :class="['px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset shrink-0', tierStyles[c.tier]]">
                {{ tierLabels[c.tier] }}
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-1.5 text-sm text-slate-600">
          <p class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span class="truncate">{{ c.phone }}</span>
          </p>
          <p v-if="c.email" class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <span class="truncate">{{ c.email }}</span>
          </p>
          <p v-if="c.address" class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span class="truncate">{{ c.address }}</span>
          </p>
        </div>

        <p class="text-xs text-slate-400 mt-auto pt-3 border-t border-slate-100">
          Cliente desde {{ timeAgo(c.createdAt) }}
        </p>

        <div class="flex items-center gap-2">
          <button @click="openEdit(c)" class="btn-ghost text-xs p-2 ml-auto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button @click="handleDelete(c.id)" class="btn-ghost text-xs text-rose-500 hover:bg-rose-50 p-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-linear-to-tr from-indigo-100 to-violet-100 grid place-items-center text-2xl mb-4">👥</div>
      <h3 class="font-semibold text-slate-900">{{ store.stats.total ? 'Sin resultados' : 'Sin clientes registrados' }}</h3>
      <p class="text-sm text-slate-500 mt-1 mb-5">
        {{ store.stats.total ? 'Prueba con otros filtros.' : 'Añade clientes para llevar un control de pedidos.' }}
      </p>
      <button v-if="!store.stats.total" @click="openCreate" class="btn-primary">Crear primer cliente</button>
      <button v-else @click="clearFilters" class="btn-ghost">Limpiar filtros</button>
    </div>

    <ClientFormModal v-model="modalOpen" :item="editing" />
  </div>
</template>