<script setup>
import { computed } from 'vue'
import { useItemsStore, CATEGORIES } from '@/stores/items'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  item: Object
})
const emit = defineEmits(['update:modelValue', 'charged'])

const itemsStore = useItemsStore()
const settings = useSettingsStore()
const toast = useToast()

/** Pedido completo al que pertenece la prenda */
const order = computed(() => itemsStore.getOrderByItem(props.item))

const lines = computed(() => order.value?.lines || (props.item ? [props.item] : []))
const isCharged = computed(() => lines.value.length > 0 && lines.value.every(l => l.status === 'cobrado'))
const cat = computed(() =>
  CATEGORIES.find(c => c.id === props.item?.category)
)
const catOf = (line) => CATEGORIES.find(c => c.id === line?.category)

// Subtotal = suma de las prendas · Total = subtotal
const subtotal = computed(() =>
  lines.value.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)
)
const total = computed(() => subtotal.value)

function close() {
  emit('update:modelValue', false)
}

function handleCharge() {
  if (!props.item) return
  const res = itemsStore.chargeOrder(order.value?.id || props.item.id)
  if (res?.blocked) {
    toast.error('No se pudo cobrar el pedido')
    return
  }
  toast.success(`Pediente cobrado: ${settings.format(total)}`)
  emit('charged')
  close()
}

/**
 * Genera HTML de ticket y lo imprime con el diálogo del navegador.
 * Compatible con impresoras térmicas 58mm y 80mm.
 */
function printReceipt() {
  const item = props.item
  if (!item) return

  const orderData = order.value
  const code = orderData?.code || item.code || '—'
  const rowLines = lines.value.length ? lines.value : [item]
  const currency = settings.current?.symbol || 'Bs'

  const clientName = orderData?.clientName || item.clientName || 'Consumidor Final'
  const clientPhone = orderData?.clientPhone || item.clientPhone || ''
  const clientPhone2 = orderData?.clientPhone2 || item.clientPhone2 || ''

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-BO')
  const timeStr = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })

  const fmt = (n) => `${currency} ${Number(n || 0).toFixed(2)}`

  const rowsHtml = rowLines.map(l => {
    const qty = Number(l.quantity) || 1
    const price = Number(l.price) || 0
    const lineTotal = price * qty
    const c = CATEGORIES.find(x => x.id === l.category)
    return `
        <div class="row">
          <span>${qty} × ${l.name}</span>
          <span>${fmt(lineTotal)}</span>
        </div>
        <div class="row small">
          <span>${c ? c.label : ''} · ${fmt(price)} c/u</span>
          <span></span>
        </div>`
  }).join('')

  const sub = rowLines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 1), 0)

  // Abre una ventana nueva con el ticket
  const win = window.open('', '_blank', 'width=380,height=650,scrollbars=yes')

  if (!win) {
    toast.error('Permite las ventanas emergentes para imprimir')
    return
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Comprobante ${code}</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #000;
          background: #fff;
        }
        .ticket {
          width: 76mm;
          margin: 0 auto;
          padding: 6mm 3mm;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .big { font-size: 15px; }
        .small { font-size: 10px; }
        .row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin: 3px 0;
        }
        .row > span:first-child { flex: 1; }
        .row > span:last-child { text-align: right; white-space: nowrap; }
        .divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .divider-solid {
          border-top: 1px solid #000;
          margin: 8px 0;
        }
        h1, h2, h3, p { margin: 0; }
        .total {
          font-size: 16px;
          font-weight: bold;
          margin-top: 4px;
        }
        .thanks {
          text-align: center;
          margin-top: 12px;
          font-size: 11px;
        }
        @media print {
          .no-print { display: none !important; }
          html, body { width: 80mm; }
        }
        .no-print {
          text-align: center;
          margin: 20px 0;
          font-family: system-ui, sans-serif;
        }
        .no-print button {
          padding: 10px 20px;
          font-size: 14px;
          border: none;
          background: #4f46e5;
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          margin: 0 4px;
        }
        .no-print button:hover { background: #4338ca; }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button onclick="window.print()">🖨️ Imprimir</button>
        <button onclick="window.close()" style="background:#64748b">Cerrar</button>
      </div>

      <div class="ticket">
        <div class="center bold big">LAUNDRYPRO</div>
        <div class="center small">Sistema de Limpieza Profesional</div>
        <div class="center small">${dateStr} · ${timeStr}</div>

        <div class="divider"></div>

        <div class="row"><span>Ticket:</span><span class="bold">${code}</span></div>
        <div class="row"><span>Cliente:</span><span>${clientName}</span></div>
        ${clientPhone ? `<div class="row"><span>Celular:</span><span>${clientPhone}</span></div>` : ''}
        ${clientPhone2 ? `<div class="row"><span>Celular 2:</span><span>${clientPhone2}</span></div>` : ''}

        <div class="divider"></div>

        <div class="row bold">
          <span>DESCRIPCIÓN</span>
          <span>IMPORTE</span>
        </div>
${rowsHtml}

        <div class="divider"></div>

        <div class="row">
          <span>Subtotal</span>
          <span>${fmt(sub)}</span>
        </div>

        <div class="divider-solid"></div>

        <div class="row total">
          <span>TOTAL</span>
          <span>${fmt(sub)}</span>
        </div>

        <div class="divider"></div>

        <div class="thanks">
          ¡Gracias por su preferencia!<br>
          <span class="small">Conserve este comprobante</span>
        </div>

        <div class="center small" style="margin-top:8px">${code}</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 250);
        };
      <\/script>
    </body>
    </html>
  `)

  win.document.close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue && item" class="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="close" />

        <div class="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <h2 class="font-semibold text-slate-900">Vista previa del comprobante</h2>
              <span v-if="isCharged" class="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200">
                Cobrado
              </span>
            </div>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Vista previa del ticket -->
          <div class="flex-1 overflow-y-auto p-5 bg-slate-50">
            <div class="bg-white p-6 rounded-lg shadow-sm font-mono text-sm text-slate-800 max-w-[320px] mx-auto">
              <!-- Encabezado -->
              <div class="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
                <p class="font-bold text-base">LAUNDRYPRO</p>
                <p class="text-xs text-slate-500">Sistema de Limpieza Profesional</p>
                <p class="text-xs text-slate-500 mt-1">{{ formatDate(new Date().toISOString()) }}</p>
              </div>

              <!-- Info ticket + cliente -->
              <div class="mb-3 text-xs space-y-1">
                <div class="flex justify-between">
                  <span class="text-slate-500">Ticket:</span>
                  <span class="font-semibold">{{ order?.code || item.code }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Cliente:</span>
                  <span class="font-medium text-right truncate ml-2">{{ item.clientName || 'Consumidor Final' }}</span>
                </div>
                <div v-if="item.clientPhone" class="flex justify-between">
                  <span class="text-slate-500">Celular:</span>
                  <span>{{ item.clientPhone }}</span>
                </div>
                <div v-if="item.clientPhone2" class="flex justify-between">
                  <span class="text-slate-500">Celular 2:</span>
                  <span>{{ item.clientPhone2 }}</span>
                </div>
              </div>

              <!-- Detalle -->
              <div class="border-t border-dashed border-slate-300 pt-3">
                <div class="flex justify-between font-bold text-xs">
                    <span>DESCRIPCIÓN</span>
                    <span>IMPORTE</span>
                </div>
                <div
                  v-for="line in lines"
                  :key="line.id"
                  class="flex justify-between mt-2 text-xs"
                >
                  <div class="min-w-0">
                    <p class="truncate">{{ line.quantity || 1 }} × {{ line.name }}</p>
                    <p class="text-slate-500">
                      {{ catOf(line)?.label }} · {{ settings.format(line.price || 0) }} c/u
                    </p>
                  </div>
                  <p class="whitespace-nowrap ml-2">
                    {{ settings.format((Number(line.price) || 0) * (Number(line.quantity) || 1)) }}
                  </p>
                </div>
              </div>

              <!-- Subtotal y total -->
              <div class="border-t border-dashed border-slate-300 mt-4 pt-3 space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-slate-500">Subtotal</span>
                  <span>{{ settings.format(subtotal) }}</span>
                </div>
                <div class="flex justify-between font-bold text-base pt-1 border-t border-dashed border-slate-200">
                  <span>TOTAL</span>
                  <span>{{ settings.format(total) }}</span>
                </div>
              </div>

              <!-- Pie -->
              <div class="text-center mt-6 pt-4 border-t border-dashed border-slate-300 text-xs text-slate-500">
                <p>¡Gracias por su preferencia!</p>
                <p class="mt-1">{{ order?.code || item.code }}</p>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="p-4 border-t border-slate-100 space-y-2">
            <button
              v-if="!isCharged"
              @click="handleCharge"
              class="w-full btn-primary"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Cobrar {{ settings.format(total) }}
            </button>
            <button @click="printReceipt" class="w-full btn-ghost border border-slate-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v3h10z"/></svg>
              Imprimir comprobante
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
.modal-enter-active > div:last-child, .modal-leave-active > div:last-child { transition: transform .3s cubic-bezier(.16,1,.3,1); }
.modal-enter-from > div:last-child, .modal-leave-to > div:last-child { transform: translateY(30px) scale(.98); }
</style>
