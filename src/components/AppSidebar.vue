<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useItemsStore } from '@/stores/items'
import { useMaterialsStore } from '@/stores/materials'
import { useMachinesStore } from '@/stores/machines'
import { useClientsStore } from '@/stores/clients'


const materials = useMaterialsStore()
const machines = useMachinesStore()
const clients = useClientsStore()

defineProps({ open: Boolean })
defineEmits(['close'])

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const items = useItemsStore()

const nav = [
  { name: 'dashboard', label: 'Panel', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'items', label: 'Prendas', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'settings', label: 'Ajustes', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { name: 'settings', label: 'Ajustes', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
]

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <!-- Overlay móvil -->
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" @click="$emit('close')" />
  </Transition>

  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 w-64 bg-white/85 backdrop-blur-xl border-r border-slate-200/80 flex flex-col transition-transform duration-300 lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <div class="h-16 flex items-center gap-3 px-5 border-b border-slate-200/80">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 grid place-items-center text-white shadow-lg shadow-indigo-500/30">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
        </svg>
      </div>
      <div>
        <p class="font-semibold text-slate-900 leading-tight">LaundryPro</p>
        <p class="text-xs text-slate-500">Gestión de limpieza</p>
      </div>
    </div>

    <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
  <RouterLink
    v-for="link in [
      { name: 'dashboard', label: 'Panel', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { name: 'items', label: 'Prendas', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', badge: items.stats.total },
      { name: 'materials', label: 'Materiales', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', badge: materials.stats.total, badgeColor: 'rose' },
      { name: 'machines', label: 'Máquinas', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z', badge: machines.stats.total },
      { name: 'clients', label: 'Clientes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', badge: clients.stats.total }
    ]"
    :key="link.name"
    :to="{ name: link.name }"
    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition"
    :class="route.name === link.name || (link.name === 'items' && route.name === 'item-detail')
      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
    @click="$emit('close')"
  >
    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
    </svg>
    <span>{{ link.label }}</span>
    <span v-if="link.badge" :class="[
      'ml-auto text-xs font-semibold px-2 py-0.5 rounded-full',
      link.badgeColor === 'rose' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
    ]">
      {{ link.badge }}
    </span>
  </RouterLink>

  <RouterLink
    :to="{ name: 'settings' }"
    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition"
    :class="route.name === 'settings' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
    @click="$emit('close')"
  >
    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
    <span>Ajustes</span>
  </RouterLink>
</nav>

    <div class="p-3 border-t border-slate-200/80">
      <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 grid place-items-center text-white text-sm font-semibold">
          {{ auth.user?.name?.[0]?.toUpperCase() || 'U' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-800 truncate">{{ auth.user?.name }}</p>
          <p class="text-xs text-slate-500 truncate">{{ auth.user?.email }}</p>
        </div>
        <button @click="logout" title="Salir" class="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>