<script setup>
import { computed } from 'vue'
import { CATEGORIES, STATUSES, useItemsStore } from '@/stores/Items.js'
import { useAuthStore } from '@/stores/auth.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import StatusBadge from './StatusBadge.vue'
import { formatDate, timeAgo } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  item: Object
})
const emit = defineEmits(['update:modelValue', 'edit'])

const items = useItemsStore()
const auth = useAuthStore()
const settings = useSettingsStore()
const toast = useToast()
const { confirm } = useConfirm()

/** El administrador del negocio solo consulta el pedido */
const canEdit = computed(() => auth.can('items.edit'))
const canManage = computed(() => auth.can('items.cancel'))
const canArchive = computed(() => auth.can('items.archive'))

/** Pedido completo al que pertenece la prenda */
const order = computed(() => items.getOrderByItem(props.item))

const lines = computed(() => order.value?.lines || (props.item ? [props.item] : []))
const cat = computed(() => CATEGORIES.find(c => c.id === props.item?.category))
const catOf = (line) => CATEGORIES.find(c => c.id === line?.category)
const subtotal = computed(() =>
  lines.value.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)
)
const total = computed(() => subtotal.value)

const history = computed(() => {
  const all = lines.value.flatMap(i => (i.history || []).map(h => ({ ...h, code: i.code })))
  return all.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
})

function close() { emit('update:modelValue', false) }
function onEdit() {
  close()
  emit('edit', props.item)
}

const orderId = computed(() => order.value?.id || props.item?.id)

async function onCancel() {
  const ok = await confirm({
    title: 'Cancelar pedido',
    message: '¿Cancelar este pedido? No se borra, queda registrado como cancelado y puedes reactivarlo.',
    confirmText: 'Cancelar pedido',
    danger: true
  })
  if (!ok) return
  items.cancelOrder(orderId.value)
  toast.success('Pedido cancelado')
}

function onReactivate() {
  items.reactivateOrder(orderId.value)
  toast.success('Pedido reactivado')
}

async function onArchive() {
  const ok = await confirm({
    title: 'Archivar pedido',
    message: '¿Archivar este pedido? Dejará de aparecer en la lista de prendas activas.',
    confirmText: 'Archivar'
  })
  if (!ok) return
  items.archiveOrder(orderId.value)
  toast.success('Pedido archivado')
}

function onUnarchive() {
  items.unarchiveOrder(orderId.value)
  toast.success('Pedido desarchivado')
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
                <h2 class="text-lg font-bold text-slate-900 truncate">{{ order?.code || item.code }}</h2>
                <p class="text-sm text-slate-500">
                  {{ order?.count || 1 }} prenda(s) · {{ order?.clientName || cat?.label }}
                </p>
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

            <!-- ===== LISTA DE PRENDAS ===== -->
            <div>
              <p class="text-xs text-slate-500 uppercase tracking-wide mb-2">Prendas</p>
              <div class="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                <div
                  v-for="line in lines"
                  :key="line.id"
                  class="flex items-center justify-between gap-3 px-3.5 py-2.5"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-800 truncate">
                      {{ line.quantity || 1 }} × {{ line.name }}
                    </p>
                    <p class="text-xs text-slate-500">{{ catOf(line)?.label }} · {{ line.code }}</p>
                  </div>
                  <p class="text-sm font-semibold text-slate-800 whitespace-nowrap">
                    {{ settings.format((Number(line.price) || 0) * (Number(line.quantity) || 1)) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- ===== TOTALES ===== -->
            <div class="rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <p class="text-emerald-700">Subtotal ({{ lines.length }} prendas)</p>
                <p class="font-medium text-emerald-800">{{ settings.format(subtotal) }}</p>
              </div>
              <div class="flex items-center justify-between pt-1.5 border-t border-emerald-200">
                <p class="text-emerald-700 uppercase tracking-wide font-semibold">Total</p>
                <p class="text-2xl font-bold text-emerald-700">{{ settings.format(total) }}</p>
              </div>
            </div>

            <!-- Fechas -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="rounded-xl bg-slate-50 p-3 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wide">Entregado</p>
                <p class="mt-1 font-semibold text-slate-900 text-sm">{{ item.pickup ? formatDate(item.pickup) : '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-3 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wide">Entrega</p>
                <p class="mt-1 font-semibold text-slate-900 text-sm">{{ item.delivery ? formatDate(item.delivery) : '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-3 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wide">P. Unitario</p>
                <p class="mt-1 font-semibold text-slate-900">{{ settings.format(item.price || 0) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-3 text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wide">Cantidad</p>
                <p class="mt-1 font-semibold text-slate-900">{{ item.quantity || 1 }} ud</p>
              </div>
            </div>

            <!-- Datos del cliente -->
            <div v-if="item.clientName" class="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4">
              <p class="text-xs text-indigo-700 uppercase tracking-wide mb-2">Cliente</p>
              <div class="space-y-1 text-sm">
                <p class="font-semibold text-slate-900">{{ item.clientName }}</p>
                <p v-if="item.clientPhone" class="text-slate-600">📱 {{ item.clientPhone }}</p>
                <p v-if="item.clientPhone2" class="text-slate-600">📱 {{ item.clientPhone2 }}</p>
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
          <div class="p-5 border-t border-slate-100 flex flex-col gap-3">
            <div v-if="canManage || canArchive" class="flex gap-3">
              <button
                v-if="canManage && !item.cancelled"
                @click="onCancel"
                class="btn-ghost flex-1 border border-slate-200 text-slate-600"
              >
                Cancelar pedido
              </button>
              <button
                v-else-if="canManage"
                @click="onReactivate"
                class="btn-ghost flex-1 border border-emerald-200 text-emerald-600"
              >
                Reactivar pedido
              </button>
              <button
                v-if="canArchive && !item.archived"
                @click="onArchive"
                class="btn-ghost flex-1 border border-slate-200 text-slate-600"
              >
                Archivar
              </button>
              <button
                v-else-if="canArchive"
                @click="onUnarchive"
                class="btn-ghost flex-1 border border-indigo-200 text-indigo-600"
              >
                Desarchivar
              </button>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <button @click="close" class="btn-ghost flex-1 border border-slate-200">
                Cerrar
              </button>
              <button v-if="canEdit" @click="onEdit" class="btn-primary flex-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Editar pedido
              </button>
            </div>
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
