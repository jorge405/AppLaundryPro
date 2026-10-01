<script setup>
const props = defineProps({
  modelValue: String,
  options: Array // [{ id, label, color }]
})
const emit = defineEmits(['update:modelValue'])

const styles = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  lavando: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  secando: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
  planchando: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  listo: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  entregado: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
  operativa: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  mantenimiento: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  averiada: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  inactiva: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
}

function onChange(e) {
  emit('update:modelValue', e.target.value)
}
</script>

<template>
  <div class="relative inline-block">
    <select
      :value="modelValue"
      @change="onChange"
      :class="[
        'appearance-none cursor-pointer pl-3 pr-7 py-1 rounded-full text-xs font-medium border ring-0 outline-none transition',
        styles[modelValue] || 'bg-slate-100 text-slate-600 border-slate-200'
      ]"
    >
      <option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option>
    </select>
    <svg class="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
         fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
    </svg>
  </div>
</template>