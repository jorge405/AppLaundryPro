<script setup>
import { computed } from 'vue'
import { CATEGORIES, STATUSES } from '@/stores/Items.js'
import { useSettingsStore } from '@/stores/settings.js'
import StatusBadge from './StatusBadge.vue'
import { formatDate, timeAgo } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  item: Object
})
const emit = defineEmits(['update:modelValue', 'edit'])

const settings = useSettingsStore()

const cat = computed(() => CATEGORIES.find(c => c.id === props.item?.category))
const history = computed(() => [...(props.item?.history || [])].reverse())

function close() { emit('update:modelValue', false) }
function onEdit() {
  close()
  emit('edit', props.item)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue && item" class="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="close" />

        <div class="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
            <div class="flex items-center gap-4 min-w-0">
              <div class="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-50 to-violet-50 grid place-items-center text-2xl shrink-0">
                {{ cat?.icon || '📦' }}
              </div>
              <div class="min-w-0">
                <h2 class="text-lg font-bold text-slate-900 truncate">{{ item.name }}</h2>
                <p class="text-sm text-slate-500">{{ item.code }} · {{ cat?.label }}</p>
              </div>
            </div>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100 shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body scrollable -->
          <div class="flex-1 overflow-y-auto p-5 space-y-5">

            <!-- Estado + tiempo -->
            <div class="flex items-center gap-3 flex-wrap">
              <StatusBadge :status="item.status" />
              <span class="text-xs text-slate-500">Actualizado {{ timeAgo(item.updatedAt) }}</span>
            </div>

            <!-- Métricas -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="rounded-xl bg-slate-50 p-3 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wide">Cantidad</p>
                <p class="mt-1 font-semibold text-slate-900">{{ item.quantity || 1 }} ud</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-3 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wide">Precio</p>
                <p class="mt-1 font-semibold text-slate-900">{{ settings.format(item.price || 0) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-3 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wide">Recogida</p>
                <p class="mt-1 font-semibold text-slate-900 text-sm">{{ item.pickup ? formatDate(item.pickup) : '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-3 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wide">Entrega</p>
                <p class="mt-1 font-semibold text-slate-900 text-sm">{{ item.delivery ? formatDate(item.delivery) : '—' }}</p>
              </div>
            </div>

            <!-- Notas -->
            <div v-if="item.notes">
              <p class="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Notas</p>
              <p class="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-xl p-3.5">
                {{ item.notes }}
              </p>
            </div>

            <!-- Trazabilidad -->
            <div>
              <p class="text-xs text-slate-500 uppercase tracking-wide mb-3">Trazabilidad</p>
              <ol class="relative border-l-2 border-slate-100 ml-2 space-y-4">
                <li v-for="(h, i) in history" :key="i" class="ml-6 relative">
                  <span class="absolute -left-7.75 top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-500"></span>
                  <p class="text-sm font-medium text-slate-800">
                    {{ STATUSES.find(s => s.id === h.status)?.label || h.status }}
                  </p>
                  <p class="text-xs text-slate-500">{{ formatDate(h.at) }} · {{ timeAgo(h.at) }}</p>
                  <p v-if="h.note" class="text-xs text-slate-500 mt-0.5">{{ h.note }}</p>
                </li>
                <li v-if="!history.length" class="ml-6 text-sm text-slate-400 italic">
                  Sin movimientos registrados
                </li>
              </ol>
            </div>
          </div>

          <!-- Footer acciones -->
          <div class="p-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <button @click="close" class="btn-ghost flex-1 border border-slate-200">
              Cerrar
            </button>
            <button @click="onEdit" class="btn-primary flex-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Editar prenda
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active > div:last-child, .modal-leave-active > div:last-child {
  transition: transform .3s cubic-bezier(.16,1,.3,1);
}
.modal-enter-from > div:last-child, .modal-leave-to > div:last-child {
  transform: translateY(30px) scale(.98);
}
</style>