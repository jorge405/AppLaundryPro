<script setup>
const props = defineProps({
  modelValue: String,
  options: Array,
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const styles = {
  pendiente:    'bg-amber-50 text-amber-700 border-amber-200',
  lavando:      'bg-sky-50 text-sky-700 border-sky-200',
  secando:      'bg-violet-50 text-violet-700 border-violet-200',
  planchando:   'bg-rose-50 text-rose-700 border-rose-200',
  listo:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  cobrado:      'bg-teal-50 text-teal-700 border-teal-200',
  operativa:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  mantenimiento:'bg-amber-50 text-amber-700 border-amber-200',
  averiada:     'bg-rose-50 text-rose-700 border-rose-200',
  inactiva:     'bg-slate-100 text-slate-600 border-slate-200'
}

function onChange(e) {
  if (props.disabled) return
  emit('update:modelValue', e.target.value)
}
</script>

<template>
  <div class="relative inline-block" :title="disabled ? 'Bloqueado: prenda cobrada o entregada' : ''">
    <select
      :value="modelValue"
      :disabled="disabled"
      @change="onChange"
      :class="[
        'appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-medium border ring-0 outline-none transition',
        styles[modelValue] || 'bg-slate-100 text-slate-600 border-slate-200',
        disabled
          ? 'opacity-70 cursor-not-allowed pr-3'
          : 'cursor-pointer hover:brightness-95'
      ]"
    >
      <option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option>
    </select>

    <!-- Ícono candado si está bloqueado -->
    <svg
      v-if="disabled"
      class="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
      fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>

    <!-- Flechita si NO está bloqueado -->
    <svg
      v-else
      class="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
      fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
    </svg>
  </div>
</template>