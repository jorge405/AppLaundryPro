<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const styles = {
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  error: 'bg-rose-50 text-rose-800 ring-rose-200',
  info: 'bg-slate-50 text-slate-800 ring-slate-200'
}
const icons = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[80] flex flex-col gap-2 items-end">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['flex items-center gap-3 px-4 py-3 rounded-xl ring-1 ring-inset shadow-lg backdrop-blur max-w-sm', styles[t.type]]"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="icons[t.type]"/>
          </svg>
          <p class="text-sm font-medium">{{ t.message }}</p>
          <button @click="remove(t.id)" class="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .3s cubic-bezier(.16,1,.3,1); }
.toast-enter-from { opacity: 0; transform: translateX(30px); }
.toast-leave-to { opacity: 0; transform: scale(.9); }
</style>