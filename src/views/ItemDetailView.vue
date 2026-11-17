<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useItemsStore, CATEGORIES, STATUSES } from '@/stores/Items.js'
import { useAuthStore } from '@/stores/auth.js'
import StatusBadge from '@/components/StatusBadge.vue'
import ItemFormModal from '@/components/ItemFormModal.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { formatDate, formatMoney, timeAgo } from '@/utils/format'
import { useSettingsStore } from '@/stores/settings.js'
const settings = useSettingsStore()


const route = useRoute()
const router = useRouter()
const items = useItemsStore()
const auth = useAuthStore()
const toast = useToast()
const { confirm } = useConfirm()

/** El administrador del negocio solo consulta el pedido */
const canEdit = computed(() => auth.can('items.edit'))
const canManage = computed(() => auth.can('items.cancel'))
const canArchive = computed(() => auth.can('items.archive'))
const canDelete = computed(() => auth.can('items.delete'))

const modalOpen = ref(false)

const item = computed(() => items.getById(route.params.id))
const order = computed(() => items.getOrderByItem(item.value))
const lines = computed(() => order.value?.lines || (item.value ? [item.value] : []))
const cat = computed(() => CATEGORIES.find(c => c.id === item.value?.category))
const catOf = (line) => CATEGORIES.find(c => c.id === line?.category)
const subtotal = computed(() =>
  lines.value.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)
)
const total = computed(() => subtotal.value)
const history = computed(() => {
  const all = lines.value.flatMap(i => (i.history || []).map(h => ({ ...h, code: i.code })))
  return all.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
})

async function handleDelete() {
  const ok = await confirm({
    title: 'Eliminar pedido',
    message: `¿Eliminar el pedido ${order.value?.code || ''} con ${lines.value.length} prenda(s)? Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (ok) {
    for (const l of lines.value) items.removeItem(l.id)
    toast.success('Pedido eliminado')
    router.push({ name: 'items' })
  }
}

async function handleCancel() {
  const ok = await confirm({
    title: 'Cancelar pedido',
    message: '¿Cancelar este pedido? No se borra, queda registrado como cancelado y puedes reactivarlo.',
    confirmText: 'Cancelar pedido',
    danger: true
  })
  if (!ok) return
  items.cancelOrder(order.value?.id || item.value.id)
  toast.success('Pedido cancelado')
}

function handleReactivate() {
  items.reactivateOrder(order.value?.id || item.value.id)
  toast.success('Pedido reactivado')
}

async function handleArchive() {
  const ok = await confirm({
    title: 'Archivar pedido',
    message: '¿Archivar este pedido? Dejará de aparecer en la lista de prendas activas.',
    confirmText: 'Archivar'
  })
  if (!ok) return
  items.archiveOrder(order.value?.id || item.value.id)
  toast.success('Pedido archivado')
}

function handleUnarchive() {
  items.unarchiveOrder(order.value?.id || item.value.id)
  toast.success('Pedido desarchivado')
}

function advance() {
  for (const l of lines.value) items.advanceStatus(l.id)
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
            <div class="w-16 h-16 rounded-2xl bg-linear-to-tr from-indigo-50 to-violet-50 grid place-items-center text-3xl shrink-0">
              {{ cat?.icon }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 class="text-xl font-bold text-slate-900">{{ order?.code || item.code }}</h1>
                  <p class="text-sm text-slate-500 mt-0.5">
                    {{ order?.count || 1 }} prenda(s) · {{ item.clientName || cat?.label }}
                  </p>
                </div>
                <StatusBadge :status="item.status" />
              </div>
            </div>
          </div>

          <!-- Lista de prendas -->
          <div class="mt-6 pt-6 border-t border-slate-100">
            <p class="text-xs text-slate-500 uppercase tracking-wide mb-2">Prendas</p>
            <div class="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              <RouterLink
                v-for="line in lines"
                :key="line.id"
                :to="{ name: 'item-detail', params: { id: line.id } }"
                class="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50"
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
              </RouterLink>
            </div>

            <!-- Totales -->
            <div class="rounded-xl bg-emerald-50 border border-emerald-100 p-4 mt-4 space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <p class="text-emerald-700">Subtotal ({{ lines.length }} prendas)</p>
                <p class="font-medium text-emerald-800">{{ settings.format(subtotal) }}</p>
              </div>
              <div class="flex items-center justify-between pt-1.5 border-t border-emerald-200">
                <p class="text-emerald-700 uppercase tracking-wide font-semibold">Total</p>
                <p class="text-2xl font-bold text-emerald-700">{{ settings.format(total) }}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p class="text-xs text-slate-500 uppercase tracking-wide">Cantidad</p>
              <p class="mt-1 font-semibold text-slate-900">{{ lines.length }} ud</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 uppercase tracking-wide">Precio</p>
              <p class="mt-1 font-semibold text-slate-900">{{ settings.format(item.price) }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 uppercase tracking-wide">Entregado</p>
              <p class="mt-1 font-semibold text-slate-900 text-sm">{{ item.pickup ? formatDate(item.pickup) : '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 uppercase tracking-wide">Entrega</p>
              <p class="mt-1 font-semibold text-slate-900 text-sm">{{ item.delivery ? formatDate(item.delivery) : '—' }}</p>
            </div>
          </div>

          <div v-if="item.clientName" class="mt-6 pt-6 border-t border-slate-100">
            <p class="text-xs text-slate-500 uppercase tracking-wide mb-2">Cliente</p>
            <div class="space-y-1 text-sm">
              <p class="font-semibold text-slate-900">{{ item.clientName }}</p>
              <p v-if="item.clientPhone" class="text-slate-600">📱 {{ item.clientPhone }}</p>
              <p v-if="item.clientPhone2" class="text-slate-600">📱 {{ item.clientPhone2 }}</p>
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
              <span class="absolute -left-7.75 top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-500"></span>
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
          <div v-if="canEdit || canManage || canArchive || canDelete" class="space-y-2">
            <button v-if="canEdit && item.status !== 'cobrado' && !item.cancelled && !item.archived" @click="advance" class="btn-primary w-full">
              Avanzar estado
            </button>
            <button v-if="canEdit" @click="modalOpen = true" class="btn-ghost w-full border border-slate-200">
              Editar pedido
            </button>
            <button
              v-if="canManage && !item.cancelled"
              @click="handleCancel"
              class="btn-ghost w-full border border-slate-200 text-slate-600"
            >
              Cancelar pedido
            </button>
            <button
              v-else-if="canManage"
              @click="handleReactivate"
              class="btn-ghost w-full border border-emerald-200 text-emerald-600"
            >
              Reactivar pedido
            </button>
            <button
              v-if="canArchive && !item.archived"
              @click="handleArchive"
              class="btn-ghost w-full border border-slate-200 text-slate-600"
            >
              Archivar pedido
            </button>
            <button
              v-else-if="canArchive"
              @click="handleUnarchive"
              class="btn-ghost w-full border border-indigo-200 text-indigo-600"
            >
              Desarchivar pedido
            </button>
            <button v-if="canDelete" @click="handleDelete" class="btn-ghost w-full text-rose-500 hover:bg-rose-50">
              Eliminar definitivamente
            </button>
          </div>
          <p v-else class="text-xs text-slate-400">
            El administrador del negocio tiene acceso de solo lectura a los pedidos.
          </p>
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
