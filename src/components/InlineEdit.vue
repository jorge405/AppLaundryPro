<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  placeholder: String,
  suffix: String,
  min: Number,
  step: { type: [String, Number], default: 1 },
  align: { type: String, default: 'left' }
})

const emit = defineEmits(['update:modelValue'])

const editing = ref(false)
const temp = ref(props.modelValue)
const inputRef = ref(null)

watch(() => props.modelValue, (v) => { if (!editing.value) temp.value = v })

async function start() {
  temp.value = props.modelValue
  editing.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select?.()
}

function save() {
  if (temp.value !== props.modelValue) {
    emit('update:modelValue', temp.value)
  }
  editing.value = false
}

function cancel() {
  temp.value = props.modelValue
  editing.value = false
}
</script>

<template>
  <span class="inline-flex items-center gap-1 group">
    <template v-if="!editing">
      <span
        @click="start"
        :class="[
          'cursor-pointer rounded px-1 -mx-1 transition hover:bg-indigo-50 hover:text-indigo-700',
          align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
        ]"
        :title="'Clic para editar'"
      >
        <slot>{{ modelValue }}{{ suffix ? ` ${suffix}` : '' }}</slot>
      </span>
      <svg class="w-3 h-3 text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition shrink-0"
           fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
      </svg>
    </template>

    <input
      v-else
      ref="inputRef"
      v-model="temp"
      :type="type"
      :placeholder="placeholder"
      :min="min"
      :step="step"
      @blur="save"
      @keydown.enter.prevent="save"
      @keydown.esc.prevent="cancel"
      :class="[
        'w-full min-w-0 bg-white border-2 border-indigo-400 rounded-lg px-2 py-0.5 outline-none ring-4 ring-indigo-500/10 text-sm',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      ]"
    />
  </span>
</template>