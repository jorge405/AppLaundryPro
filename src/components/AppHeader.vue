<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings.js'

defineEmits(['toggle-sidebar'])
const route = useRoute()
const settings = useSettingsStore()

const titles = {
  dashboard: { title: 'Panel', sub: 'Resumen general de tu servicio de limpieza' },
  items: { title: 'Prendas', sub: 'Gestiona todos tus trajes, camas y ropa' },
  'item-detail': { title: 'Detalle', sub: 'Información y trazabilidad de la prenda' },
  materials: { title: 'Materiales', sub: 'Inventario de productos de limpieza' },
  machines: { title: 'Máquinas', sub: 'Equipos y mantenimiento' },
  clients: { title: 'Clientes', sub: 'Directorio de clientes' },
  settings: { title: 'Ajustes', sub: 'Preferencias del sistema' }
}

const info = computed(() => titles[route.name] || { title: 'LaundryPro', sub: '' })
</script>

<template>
  <header class="sticky top-0 z-30 glass border-b border-slate-200/70">
    <div class="flex items-center gap-4 px-4 sm:px-6 lg:px-8 h-16">
      <button @click="$emit('toggle-sidebar')" class="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="text-lg sm:text-xl font-semibold text-slate-900 truncate">{{ info.title }}</h1>
        <p class="text-xs sm:text-sm text-slate-500 truncate hidden sm:block">{{ info.sub }}</p>
      </div>

      <!-- Selector de moneda -->
      <div class="relative">
        <select
          :value="settings.activeCurrency"
          @change="settings.setActive($event.target.value)"
          class="appearance-none cursor-pointer pl-3 pr-8 py-2 rounded-xl text-sm font-medium
                 bg-white border border-slate-200 text-slate-700 outline-none
                 hover:border-indigo-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition"
        >
          <option v-for="c in settings.currencies" :key="c.id" :value="c.id">
            {{ c.symbol }} {{ c.code }}
          </option>
        </select>
        <svg class="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
             fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>

      <slot name="actions" />
    </div>
  </header>
</template>