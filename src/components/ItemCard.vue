<script setup>
import { computed } from 'vue'
import InlineEdit from './InlineEdit.vue'
import QuickStatusSelect from './QuickStatusSelect.vue'
import { CATEGORIES, STATUSES, useItemsStore } from '@/stores/items.js'
import { useSettingsStore } from '@/stores/settings.js'
import { timeAgo } from '@/utils/format'

const props = defineProps({ item: Object })
const emit = defineEmits(['delete', 'advance', 'view', 'edit'])

const items = useItemsStore()
const settings = useSettingsStore()

const cat = computed(() => CATEGORIES.find(c => c.id === props.item.category) || CATEGORIES.at(-1))

const update = (field, value) => items.updateItem(props.item.id, { [field]: value })
const updateStatus = (value) => items.updateItem(props.item.id, { status: value })

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
          <InlineEdit
            :model-value="item.name"
            @update:model-value="v => update('name', v)"
            class="font-semibold text-slate-900 block truncate"
          />
          <p class="text-xs text-slate-500">{{ item.code }} · {{ cat.label }}</p>
        </div>
      </div>
      <QuickStatusSelect
        :model-value="item.status"
        :options="statusOptions"
        @update:model-value="updateStatus"
      />
    </div>

    <!-- Notas -->
    <InlineEdit
      :model-value="item.notes"
      placeholder="Añadir nota..."
      @update:model-value="v => update('notes', v)"
      class="text-sm text-slate-600 block"
    >
      <span v-if="item.notes" class="line-clamp-2">{{ item.notes }}</span>
      <span v-else class="text-slate-300 italic text-xs">+ Añadir nota</span>
    </InlineEdit>

    <!-- Meta -->
    <div class="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
      <span class="inline-flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ timeAgo(item.updatedAt) }}
      </span>

      <span class="inline-flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        <InlineEdit
          :model-value="item.quantity || 1"
          type="number"
          :min="1"
          suffix="ud"
          @update:model-value="v => update('quantity', Number(v))"
        />
      </span>

      <span class="ml-auto font-semibold text-slate-800 inline-flex items-center gap-1">
        <span class="text-slate-400 text-[10px] uppercase">{{ settings.current.symbol }}</span>
        <InlineEdit
          :model-value="item.price || 0"
          type="number"
          :min="0"
          :step="0.01"
          align="right"
          @update:model-value="v => update('price', Number(v))"
        />
      </span>
    </div>

    <!-- Acciones -->
    <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
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
        @click="emit('edit', item)"
        class="flex-1 btn-ghost text-xs justify-center border border-slate-200"
        title="Editar"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Editar
      </button>

      <button
        v-if="item.status !== 'entregado'"
        @click="emit('advance', item.id)"
        class="btn-ghost text-xs p-2"
        title="Avanzar estado" 
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
        </svg>
      </button>

      <button
        @click="emit('delete', item.id)"
        class="btn-ghost text-xs text-rose-500 hover:bg-rose-50 p-2"
        title="Eliminar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"/>
        </svg>
      </button>
    </div>
  </div>
</template>