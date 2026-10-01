<script setup>
import { useConfirm } from '@/composables/useConfirm'

const { state, close } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="state.open" class="fixed inset-0 z-[90] grid place-items-center p-4">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="close(false)" />
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
          <h3 class="text-lg font-semibold text-slate-900">{{ state.title }}</h3>
          <p v-if="state.message" class="mt-2 text-sm text-slate-600">{{ state.message }}</p>
          <div class="mt-6 flex gap-3 justify-end">
            <button class="btn-ghost" @click="close(false)">{{ state.cancelText }}</button>
            <button :class="state.danger ? 'btn-danger' : 'btn-primary'" @click="close(true)">
              {{ state.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>