<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useItemsStore, CATEGORIES, STATUSES } from '@/stores/items'
import StatusBadge from '@/components/StatusBadge.vue'
import ItemFormModal from '@/components/ItemFormModal.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { formatDate, formatMoney, timeAgo } from '@/utils/format'
import { useSettingsStore } from '@/stores/settings'
const settings = useSettingsStore()


const route = useRoute()
const router = useRouter()
const items = useItemsStore()
const toast = useToast()
const { confirm } = useConfirm()

const modalOpen = ref(false)

const item = computed(() => items.getById(route.params.id))
const cat = computed(() => CATEGORIES.find(c => c.id === item.value?.category))
const history = computed(() => [...(item.value?.history || [])].reverse())

async function handleDelete() {
  const ok = await confirm({
    title: 'Eliminar prenda',
    message: `¿Eliminar "${item.value.name}"?`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (ok) {
    items.removeItem(item.value.id)
    toast.success('Prenda eliminada')
    router.push({ name: 'items' })
  }
}

function advance() {
  items.advanceStatus(item.value.id)
  const updated = items.getById(item.value.id)
  toast.info(`Estado: ${STATUSES.find(s => s.id === updated.status)?.label}`)
}
</script>

<template>
  <div v-if="item" class="space-y-5">
    <RouterLink :to="{ name: 'items' }" class="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
      Volver a prendas
    </RouterLink>

    <div class="grid lg:grid-cols-3 gap-5">
      <!-- Info principal -->
      <div class="lg:col-span-2 space-y-5">
        <div class="card p-6">
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 to-violet-50 grid place-items-center text-3xl shrink-0">
              {{ cat?.icon }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 class="text-xl font-bold text-slate-900">{{ item.name }}</h1>
                  <p class="text-sm text-slate-500 mt-0.5">{{ item.code }} · {{ cat?.label }}</p>
                </div>
                <StatusBadge :status="item.status" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p class="text-xs text-slate-500 uppercase tracking-wide">Cantidad</p>
              <p class="mt-1 font-semibold text-slate-900">{{ item.quantity || 1 }} ud</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 uppercase tracking-wide">Precio</p>
              <p class="mt-1 font-semibold text-slate-900">{{ settings.format(item.price) }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 uppercase tracking-wide">Recogida</p>
              <p class="mt-1 font-semibold text-slate-900 text-sm">{{ item.pickup ? formatDate(item.pickup) : '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 uppercase tracking-wide">Entrega</p>
              <p class="mt-1 font-semibold text-slate-900 text-sm">{{ item.delivery ? formatDate(item.delivery) : '—' }}</p>
            </div>
          </div>

          <div v-if="item.notes" class="mt-6 pt-6 border-t border-slate-100">
            <p class="text-xs text-slate-500 uppercase tracking-wide mb-2">Notas</p>
            <p class="text-sm text-slate-700 whitespace-pre-line">{{ item.notes }}</p>
          </div>
        </div>

        <!-- Historial -->
        <div class="card p-6">
          <h2 class="font-semibold text-slate-900 mb-4">Trazabilidad</h2>
          <ol class="relative border-l-2 border-slate-100 ml-2 space-y-4">
            <li v-for="(h, i) in history" :key="i" class="ml-6 relative">
              <span class="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-500"></span>
              <p class="text-sm font-medium text-slate-800">
                {{ STATUSES.find(s => s.id === h.status)?.label || h.status }}
              </p>
              <p class="text-xs text-slate-500">{{ formatDate(h.at) }} · {{ timeAgo(h.at) }}</p>
              <p v-if="h.note" class="text-xs text-slate-500 mt-0.5">{{ h.note }}</p>
            </li>
          </ol>
        </div>
      </div>

      <!-- Acciones -->
      <div class="space-y-3">
        <div class="card p-5 space-y-2">
          <h3 class="text-sm font-semibold text-slate-900 mb-2">Acciones rápidas</h3>
          <button v-if="item.status !== 'entregado'" @click="advance" class="btn-primary w-full">
            Avanzar estado
          </button>
          <button @click="modalOpen = true" class="btn-ghost w-full border border-slate-200">
            Editar prenda
          </button>
          <button @click="handleDelete" class="btn-ghost w-full text-rose-500 hover:bg-rose-50">
            Eliminar
          </button>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-900 mb-3">Fechas</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-slate-500">Creado</dt>
              <dd class="text-slate-800">{{ formatDate(item.createdAt) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500">Actualizado</dt>
              <dd class="text-slate-800">{{ timeAgo(item.updatedAt) }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <ItemFormModal v-model="modalOpen" :item="item" />
  </div>

  <div v-else class="card p-12 text-center">
    <p class="text-slate-500">Prenda no encontrada.</p>
    <RouterLink :to="{ name: 'items' }" class="btn-primary mt-4 inline-flex">Volver</RouterLink>
  </div>
</template>