<script setup>
import { ref, watch, computed } from 'vue'
import { CATEGORIES, STATUSES, useItemsStore } from '@/stores/Items'
import { useBranchesStore } from '@/stores/branches.js'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
const settings = useSettingsStore()


function formatMoneyLive(amount) {
  return settings.format(Number(amount) || 0)
}

const props = defineProps({ modelValue: Boolean, item: Object })
const emit = defineEmits(['update:modelValue', 'saved'])

const items = useItemsStore()
const branches = useBranchesStore()
const toast = useToast()

let uidCounter = 0
const newKey = () => `l${Date.now().toString(36)}${uidCounter++}`

const emptyLine = () => ({
  key: newKey(),
  id: null,
  name: '',
  category: 'ropa',
  quantity: 1,
  price: 0
})

const emptyForm = () => ({
  clientName: '',
  clientPhone: '',
  clientPhone2: '',
  status: 'pendiente',
  pickup: '',
  delivery: '',
  notes: '',
  branchId: branches.list[0]?.id || '',
  lines: [emptyLine()]
})

const form = ref(emptyForm())
const errors = ref({})

const isEdit = computed(() => !!props.item?.id)
const title = computed(() => isEdit.value ? 'Editar pedido' : 'Nueva prenda')

/** Pedido al que pertenece la prenda editada (grupo o prenda individual) */
const currentOrder = computed(() => {
  if (!props.item) return null
  return items.getOrderByItem(props.item)
})

watch(() => props.modelValue, (open) => {
  if (!open) return
  errors.value = {}

  if (props.item) {
    const order = currentOrder.value
    const base = order || props.item
    form.value = {
      clientName: base.clientName || '',
      clientPhone: base.clientPhone || '',
      clientPhone2: base.clientPhone2 || '',
      status: base.status || props.item.status || 'pendiente',
      pickup: base.pickup || '',
      delivery: base.delivery || '',
      notes: base.notes || '',
      branchId: base.branchId || branches.list[0]?.id || '',
      lines: (base.lines || [props.item]).map(i => ({
        key: newKey(),
        id: i.id,
        name: i.name || '',
        category: i.category || 'ropa',
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0
      }))
    }
  } else {
    form.value = emptyForm()
  }
})

/* ====== Cálculos ====== */
const subtotal = computed(() =>
  form.value.lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 0), 0)
)
const total = computed(() => subtotal.value)
const totalUnits = computed(() =>
  form.value.lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0)
)

/* ====== Manejo de líneas ====== */
function addLine() {
  form.value.lines.push(emptyLine())
}

function removeLine(idx) {
  if (form.value.lines.length === 1) {
    form.value.lines = [emptyLine()]
    return
  }
  form.value.lines.splice(idx, 1)
}

/* ====== Validación ====== */
function validate() {
  errors.value = {}
  if (!form.value.clientName?.trim()) errors.value.clientName = 'Nombre del cliente requerido'
  if (!form.value.clientPhone?.trim()) errors.value.clientPhone = 'Celular requerido'

  const filled = form.value.lines.filter(l => l.name?.trim())
  if (!filled.length) errors.value.lines = 'Agrega al menos una prenda'

  for (const l of form.value.lines) {
    if (l.name?.trim() && (Number(l.quantity) || 0) < 1) {
      errors.value.lines = 'La cantidad debe ser mínimo 1'
    }
  }
  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return

  const payload = {
    clientName: form.value.clientName.trim(),
    clientPhone: form.value.clientPhone.trim(),
    clientPhone2: form.value.clientPhone2?.trim() || '',
    status: form.value.status,
    pickup: form.value.pickup,
    delivery: form.value.delivery,
    notes: form.value.notes?.trim() || '',
    branchId: form.value.branchId || '',
    branchName: branches.getById(form.value.branchId)?.name || '',
    lines: form.value.lines
      .filter(l => l.name?.trim())
      .map(l => ({
        id: l.id,
        name: l.name.trim(),
        category: l.category,
        quantity: Number(l.quantity) || 1,
        price: Number(l.price) || 0
      }))
  }

  if (isEdit.value) {
    const order = currentOrder.value
    const groupId = order ? order.id : props.item.id
    items.updateOrder(groupId, payload)
    toast.success('Pedido actualizado')
  } else {
    const res = items.addOrder(payload)
    const n = res?.items?.length || payload.lines.length
    toast.success(n > 1 ? `${n} prendas registradas` : 'Prenda registrada')
  }
  emit('saved')
  emit('update:modelValue', false)
}

function close() { emit('update:modelValue', false) }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="close" />
        <div class="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
              <p v-if="currentOrder" class="text-xs text-slate-500 mt-0.5">
                Pedido {{ currentOrder.code }} · {{ currentOrder.count }} prenda(s)
              </p>
            </div>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">

            <!-- ===== DATOS DEL CLIENTE ===== -->
            <div class="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 space-y-3">
              <div class="flex items-center gap-2 mb-1">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <p class="text-sm font-semibold text-indigo-900">Datos del cliente</p>
              </div>

              <div>
                <label class="label">Nombre del cliente *</label>
                <input v-model="form.clientName" class="input" placeholder="Ej: María García" />
                <p v-if="errors.clientName" class="mt-1 text-xs text-rose-500">{{ errors.clientName }}</p>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label class="label">Celular *</label>
                  <input v-model="form.clientPhone" type="tel" class="input" placeholder="700-00000" />
                  <p v-if="errors.clientPhone" class="mt-1 text-xs text-rose-500">{{ errors.clientPhone }}</p>
                </div>
                <div>
                  <label class="label">Celular 2 <span class="text-slate-400 font-normal">(opcional)</span></label>
                  <input v-model="form.clientPhone2" type="tel" class="input" placeholder="600-00000" />
                </div>
                <div class="col-span-2 sm:col-span-1">
                  <label class="label">Sucursal</label>
                  <select v-model="form.branchId" class="input">
                    <option value="">Sin sucursal</option>
                    <option v-for="b in branches.list" :key="b.id" :value="b.id">{{ b.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- ===== PRENDAS (una por una) ===== -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-slate-900">Prendas a registrar</p>
                <button type="button" @click="addLine" class="btn-ghost text-xs px-3 py-1.5 border border-indigo-200 text-indigo-600">
                  + Agregar prenda
                </button>
              </div>

              <div
                v-for="(line, idx) in form.lines"
                :key="line.key"
                class="rounded-xl border border-slate-200 p-3 space-y-3"
              >
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold grid place-items-center shrink-0">
                    {{ idx + 1 }}
                  </span>
                  <input
                    v-model="line.name"
                    class="input flex-1"
                    placeholder="Ej: Traje azul marino"
                  />
                  <button
                    type="button"
                    @click="removeLine(idx)"
                    class="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 shrink-0"
                    title="Quitar prenda"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="label">Categoría</label>
                    <select v-model="line.category" class="input">
                      <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.icon }} {{ c.label }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="label">Cantidad</label>
                    <input v-model.number="line.quantity" type="number" min="1" class="input" />
                  </div>
                  <div>
                    <label class="label">P. Unitario (Bs)</label>
                    <input v-model.number="line.price" type="number" min="0" step="0.01" class="input" />
                  </div>
                </div>

                <div class="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                  <span class="text-slate-500">
                    {{ line.quantity || 0 }} × {{ formatMoneyLive(line.price) }}
                  </span>
                  <span class="font-semibold text-slate-800">
                    {{ formatMoneyLive((line.quantity || 0) * (line.price || 0)) }}
                  </span>
                </div>
              </div>

              <p v-if="errors.lines" class="text-xs text-rose-500">{{ errors.lines }}</p>
            </div>

            <!-- ===== TOTALES ===== -->
            <div class="rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <p class="text-emerald-700">Prendas ({{ totalUnits }})</p>
                <p class="font-medium text-emerald-800">{{ formatMoneyLive(subtotal) }}</p>
              </div>
              <div class="flex items-center justify-between text-sm">
                <p class="text-emerald-700 uppercase tracking-wide font-medium">Subtotal</p>
                <p class="font-semibold text-emerald-800">{{ formatMoneyLive(subtotal) }}</p>
              </div>
              <div class="flex items-center justify-between pt-1.5 border-t border-emerald-200">
                <p class="text-emerald-700 uppercase tracking-wide font-semibold">Total</p>
                <p class="text-xl font-bold text-emerald-700">{{ formatMoneyLive(total) }}</p>
              </div>
            </div>

            <!-- ===== ESTADO Y FECHAS ===== -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Estado</label>
                <select v-model="form.status" class="input">
                  <option v-for="s in STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
                </select>
              </div>
              <div></div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Entregado</label>
                <input v-model="form.pickup" type="date" class="input" />
              </div>
              <div>
                <label class="label">Entrega</label>
                <input v-model="form.delivery" type="date" class="input" />
              </div>
            </div>

            <div>
              <label class="label">Notas</label>
              <textarea v-model="form.notes" rows="3" class="input resize-none" placeholder="Instrucciones especiales, manchas, tejidos..."></textarea>
            </div>
          </form>

          <div class="p-5 border-t border-slate-100 flex gap-3">
            <button type="button" class="btn-ghost flex-1" @click="close">Cancelar</button>
            <button type="button" class="btn-primary flex-1" @click="submit">
              {{ isEdit ? 'Guardar cambios' : 'Registrar prendas' }}
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
