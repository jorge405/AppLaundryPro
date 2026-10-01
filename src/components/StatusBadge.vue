<script setup>
import { computed } from 'vue'
import { STATUSES } from '@/stores/Items.js'

const props = defineProps({ status: String })

const map = {
  pendiente: 'bg-amber-50 text-amber-700 ring-amber-200',
  lavando: 'bg-sky-50 text-sky-700 ring-sky-200',
  secando: 'bg-violet-50 text-violet-700 ring-violet-200',
  planchando: 'bg-rose-50 text-rose-700 ring-rose-200',
  listo: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  entregado: 'bg-slate-100 text-slate-600 ring-slate-200'
}

const label = computed(() => STATUSES.find(s => s.id === props.status)?.label || props.status)
</script>

<template>
  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset', map[status] || map.pendiente]">
    <span class="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
    {{ label }}
  </span>
</template>