<script setup>
/**
 * Tarjeta agrupadora por sucursal.
 * Muestra los datos de la sucursal (nombre, responsable, dirección, horario),
 * un resumen de métricas y el contenido del grupo (prendas, materiales o máquinas).
 */
defineProps({
  branch: { type: Object, default: null },
  name: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  stats: { type: Array, default: () => [] },
  dates: { type: Array, default: () => [] },
  icon: { type: String, default: '🏪' }
})
</script>

<template>
  <section class="card overflow-hidden">
    <!-- Cabecera de la sucursal -->
    <header class="flex flex-wrap items-center gap-4 px-5 py-4 bg-slate-50/70 border-b border-slate-100">
      <div class="w-11 h-11 rounded-xl bg-white border border-slate-200 grid place-items-center text-xl shrink-0">
        {{ icon }}
      </div>

      <div class="min-w-0 flex-1">
        <p class="font-semibold text-slate-900 truncate">{{ name }}</p>
        <p v-if="subtitle" class="text-xs text-slate-500 truncate">{{ subtitle }}</p>
      </div>

      <!-- Métricas -->
      <div v-if="stats.length" class="flex flex-wrap items-center gap-2">
        <div
          v-for="s in stats"
          :key="s.label"
          class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-center min-w-20"
        >
          <p class="text-sm font-bold leading-tight" :class="s.tone || 'text-slate-900'">{{ s.value }}</p>
          <p class="text-[10px] uppercase tracking-wide text-slate-400">{{ s.label }}</p>
        </div>
      </div>
    </header>

    <!-- Fechas relevantes (mantenimiento, compras, etc.) -->
    <div v-if="dates.length" class="flex flex-wrap gap-x-6 gap-y-2 px-5 py-3 border-b border-slate-100 bg-white">
      <div v-for="d in dates" :key="d.label" class="text-xs">
        <span class="text-slate-400">{{ d.label }}:</span>
        <span class="font-medium" :class="d.tone || 'text-slate-700'">{{ d.value }}</span>
      </div>
    </div>

    <!-- Contenido del grupo -->
    <div class="p-5">
      <slot />
    </div>
  </section>
</template>
