<script setup>
import { computed } from 'vue'
import QuickStatusSelect from './QuickStatusSelect.vue'
import { CATEGORIES, STATUSES, useItemsStore } from '@/stores/items'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { timeAgo } from '@/utils/format'

const props = defineProps({ item: Object })
const emit = defineEmits(['delete', 'advance', 'view', 'edit', 'view-receipt', 'cancel', 'reactivate', 'archive', 'unarchive'])

const items = useItemsStore()
const auth = useAuthStore()
const settings = useSettingsStore()
const toast = useToast()

const cat = computed(() => CATEGORIES.find(c => c.id === props.item.category) || CATEGORIES.at(-1))

// El administrador del negocio solo consulta: no edita el flujo de prendas
const canEdit = computed(() => auth.can('items.edit'))
const canManageFlow = computed(() => auth.can('items.cancel'))
const canArchive = computed(() => auth.can('items.archive'))
const canAdvance = computed(() => auth.can('items.edit'))

// Pedido al que pertenece la prenda
const order = computed(() => items.getOrderByItem(props.item))

const statusLocked = computed(() => items.isStatusLocked(props.item))

// Total = precio × cantidad
const total = computed(() =>
  (Number(props.item.price) || 0) * (Number(props.item.quantity) || 1)
)

const statusOptions = STATUSES.map(s => ({ id: s.id, label: s.label, color: s.color }))
</script>

<template>
  <div class="card p-5 flex flex-col gap-4 hover:shadow-md transition-all group">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="w-11 h-11 rounded-xl bg-slate-100 grid place-items-center text-xl shrink-0">
          {{ cat.icon }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-slate-900 truncate">{{ item.name }}</p>
          <p class="text-xs text-slate-500">{{ item.code }} · {{ cat.label }}</p>
        </div>
      </div>
      <span
        v-if="item.cancelled"
        class="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 shrink-0"
      >
        Cancelado
      </span>
      <span
        v-else-if="item.archived"
        class="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200 shrink-0"
      >
        Archivado
      </span>
      <QuickStatusSelect
        v-else-if="canAdvance"
        :model-value="item.status"
        :options="statusOptions"
        :disabled="statusLocked"
        @update:model-value="value => { const res = items.updateItem(item.id, { status: value }); if (res?.blocked) toast.error('Estado bloqueado: prenda cobrada') }"
      />
      <span
        v-else
        class="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 shrink-0"
      >
        {{ STATUSES.find(s => s.id === item.status)?.label || item.status }}
      </span>
    </div>

    <!-- Cliente -->
    <div v-if="item.clientName" class="text-xs text-slate-600 flex items-center gap-1.5 -mt-1">
      <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
      <span class="font-medium text-slate-700 truncate">{{ item.clientName }}</span>
      <span v-if="item.clientPhone" class="text-slate-400 truncate">· {{ item.clientPhone }}</span>
    </div>

    <!-- Pedido -->
    <div v-if="order" class="text-xs text-slate-500 flex items-center gap-1.5 -mt-1">
      <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-6 4h6"/>
      </svg>
      <span class="truncate">Pedido {{ order.code }} · {{ order.count }} prenda(s) · {{ settings.format(order.total) }}</span>
    </div>

    <!-- Notas (solo lectura) -->
    <p v-if="item.notes" class="text-sm text-slate-600 line-clamp-2">
      {{ item.notes }}
    </p>

    <!-- Meta: tiempo, cantidad, precio unitario, total -->
    <div class="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
      <span class="inline-flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ timeAgo(item.updatedAt) }}
      </span>

      <span class="inline-flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        {{ item.quantity || 1 }} ud
      </span>

      <span class="inline-flex items-center gap-1">
        <span class="text-slate-400">×</span>
        <span class="text-slate-400 text-[10px] uppercase">{{ settings.current.symbol }}</span>
        <span>{{ settings.format(item.price || 0) }}</span>
      </span>

      <span class="ml-auto font-bold text-emerald-600 inline-flex items-center gap-1">
        <span class="text-[10px] uppercase">{{ settings.current.symbol }}</span>
        {{ settings.convert(total).toFixed(2) }}
      </span>
    </div>

    <!-- Acciones -->
    <div class="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
      <button
        @click="emit('view', item)"
        class="flex-1 btn-ghost text-xs justify-center border border-slate-200"
        title="Ver detalle"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        Ver
      </button>

      <button
        v-if="canEdit"
        @click="emit('edit', item)"
        class="flex-1 btn-ghost text-xs justify-center border border-slate-200"
        title="Editar en el modal"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Editar
      </button>

      <button
        @click="emit('view-receipt', item)"
        class="btn-ghost text-xs p-2 border border-slate-200"
        title="Vista previa del comprobante"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 2 0 01.707.293l5.414 5.414a1 2 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </button>

      <button
        v-if="canAdvance && item.status !== 'cobrado' && !item.cancelled && !item.archived"
        @click="emit('advance', item.id)"
        class="btn-ghost text-xs p-2"
        title="Avanzar estado"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
        </svg>
      </button>

      <!-- Permitir pasar de cobrado → entregado desde la tarjeta -->
      <button
        v-if="canAdvance && item.status === 'cobrado' && !item.cancelled && !item.archived"
        @click="emit('advance', item.id)"
        class="btn-ghost text-xs p-2 text-teal-600 hover:bg-teal-50"
        title="Marcar como entregado"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </button>

      <!-- Cancelar / reactivar -->
      <button
        v-if="canManageFlow && !item.cancelled"
        @click="emit('cancel', item)"
        class="btn-ghost text-xs p-2 text-slate-500 hover:bg-slate-100"
        title="Cancelar prenda (no se borra)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <button
        v-else-if="canManageFlow"
        @click="emit('reactivate', item)"
        class="btn-ghost text-xs p-2 text-emerald-600 hover:bg-emerald-50"
        title="Reactivar prenda"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>

      <!-- Archivar / desarchivar -->
      <button
        v-if="canArchive && !item.archived"
        @click="emit('archive', item)"
        class="btn-ghost text-xs p-2 text-slate-500 hover:bg-slate-100"
        title="Archivar (sale de la lista)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
      </button>
      <button
        v-else-if="canArchive"
        @click="emit('unarchive', item)"
        class="btn-ghost text-xs p-2 text-indigo-600 hover:bg-indigo-50"
        title="Desarchivar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
      </button>
    </div>
  </div>
</template>
