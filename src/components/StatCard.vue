<script setup>
defineProps({
  label: String,
  value: [String, Number],
  icon: String,
  color: { type: String, default: 'indigo' },
  trend: String
})

const colorMap = {
  indigo: 'from-indigo-500 to-violet-500 shadow-indigo-500/30',
  amber: 'from-amber-500 to-orange-500 shadow-amber-500/30',
  sky: 'from-sky-500 to-cyan-500 shadow-sky-500/30',
  emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/30',
  rose: 'from-rose-500 to-pink-500 shadow-rose-500/30',
  slate: 'from-slate-500 to-slate-700 shadow-slate-500/30'
}
</script>

<template>
  <div class="card p-5 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <div class="min-w-0">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ label }}</p>
        <p class="mt-2 text-2xl font-bold text-slate-900">{{ value }}</p>
        <p v-if="trend" class="mt-1 text-xs text-slate-500">{{ trend }}</p>
      </div>
      <div :class="['w-11 h-11 rounded-xl grid place-items-center bg-gradient-to-tr text-white shadow-lg', colorMap[color]]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" :d="icon" />
        </svg>
      </div>
    </div>
  </div>
</template>