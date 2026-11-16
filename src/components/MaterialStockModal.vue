<script setup>
import { ref, watch, computed } from 'vue'
import { useMaterialsStore } from '@/stores/materials.js'
import { useSuppliersStore } from '@/stores/suppliers.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useToast } from '@/composables/useToast'

const props = defineProps({ modelValue: Boolean, material: Object })
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useMaterialsStore()
const suppliers = useSuppliersStore()
const settings = useSettingsStore()
const toast = useToast()

const today = () => new Date().toISOString().slice(0, 10)

const form = ref({
  quantity: 1,
  unitPrice: 0,
  supplier: '',
  date: today(),
  showNewSupplier: false,
  newSupplierName: '',
  newSupplierPhone: ''
})
const errors = ref({})

watch(() => props.modelValue, (open) => {
  if (!open) return
  errors.value = {}
  form.value = {
    quantity: 1,
    unitPrice: Number(props.material?.price) || 0,
    supplier: props.material?.supplier || '',
    date: today(),
    showNewSupplier: false,
    newSupplierName: '',
    newSupplierPhone: ''
  }
})

const supplierOptions = computed(() => {
  const set = new Set([...suppliers.names, ...store.usedSuppliers])
  return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b))
})

function pickSupplier(value) {
  form.value.showNewSupplier = value === '__new__'
  if (form.value.showNewSupplier) form.value.supplier = ''
}

const supplierName = computed(() =>
  form.value.showNewSupplier ? form.value.newSupplierName.trim() : form.value.supplier
)

const subtotal = computed(() =>
  (Number(form.value.quantity) || 0) * (Number(form.value.unitPrice) || 0)
)

const currentStock = computed(() => Number(props.material?.stock) || 0)
const newStock = computed(() => currentStock.value + (Number(form.value.quantity) || 0))

function validate() {
  errors.value = {}
  if ((Number(form.value.quantity) || 0) <= 0) errors.value.quantity = 'Cantidad mínima 1'
  if (!supplierName.value) errors.value.supplier = 'Selecciona o registra un proveedor'
  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return

  let supplier = supplierName.value
  if (form.value.showNewSupplier) {
    const created = suppliers.addSupplier({
      name: form.value.newSupplierName,
      phone: form.value.newSupplierPhone
    })
    supplier = created ? created.name : supplier
  }

  const res = store.addStock(props.material.id, {
    quantity: Number(form.value.quantity) || 0,
    unitPrice: Number(form.value.unitPrice) || 0,
    supplier,
    date: form.value.date || today()
  })

  if (res?.blocked) {
    toast.error('No se pudo registrar la compra')
    return
  }

  toast.success(`Stock actualizado: ${res.stock} ${props.material.unit}`)
  emit('saved')
  emit('update:modelValue', false)
}

function close() { emit('update:modelValue', false) }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue && material" class="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="close" />
        <div class="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Agregar stock</h2>
              <p class="text-xs text-slate-500 mt-0.5">{{ material.name }} · {{ material.code }}</p>
            </div>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">
            <!-- Stock actual → nuevo -->
            <div class="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
              <div class="text-sm">
                <p class="text-slate-500">Stock actual</p>
                <p class="font-semibold text-slate-900">{{ currentStock }} {{ material.unit }}</p>
              </div>
              <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              <div class="text-sm text-right">
                <p class="text-slate-500">Stock resultante</p>
                <p class="font-bold text-emerald-600">{{ newStock }} {{ material.unit }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Cantidad comprada *</label>
                <input v-model.number="form.quantity" type="number" min="1" step="0.1" class="input" />
                <p v-if="errors.quantity" class="mt-1 text-xs text-rose-500">{{ errors.quantity }}</p>
              </div>
              <div>
                <label class="label">Precio unitario</label>
                <input v-model.number="form.unitPrice" type="number" min="0" step="0.01" class="input" />
              </div>
            </div>

            <div>
              <label class="label">Fecha de compra</label>
              <input v-model="form.date" type="date" class="input" />
            </div>

            <!-- Proveedor -->
            <div class="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
              <label class="label mb-0">Proveedor *</label>
              <select
                v-if="!form.showNewSupplier"
                :value="form.supplier || ''"
                class="input"
                @change="pickSupplier($event.target.value)"
              >
                <option value="">Selecciona un proveedor...</option>
                <option v-for="s in supplierOptions" :key="s" :value="s">{{ s }}</option>
                <option value="__new__">+ Registrar nuevo proveedor</option>
              </select>

              <div v-else class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="label">Nombre del proveedor *</label>
                    <input v-model="form.newSupplierName" class="input" placeholder="Ej: Químicas del Norte" />
                  </div>
                  <div>
                    <label class="label">Teléfono</label>
                    <input v-model="form.newSupplierPhone" type="tel" class="input" placeholder="700-00000" />
                  </div>
                </div>
                <button type="button" @click="pickSupplier('')" class="text-xs text-indigo-600 font-medium">
                  ← Volver a la lista de proveedores
                </button>
              </div>
              <p v-if="errors.supplier" class="text-xs text-rose-500">{{ errors.supplier }}</p>
            </div>

            <!-- Subtotal -->
            <div class="rounded-xl bg-emerald-50 border border-emerald-100 p-3 space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <p class="text-emerald-700">{{ form.quantity || 0 }} × {{ settings.format(form.unitPrice || 0) }}</p>
                <p class="font-medium text-emerald-800">{{ settings.format(subtotal) }}</p>
              </div>
              <div class="flex items-center justify-between pt-1.5 border-t border-emerald-200">
                <p class="text-emerald-700 uppercase tracking-wide font-semibold">Subtotal de la compra</p>
                <p class="text-xl font-bold text-emerald-700">{{ settings.format(subtotal) }}</p>
              </div>
            </div>
          </form>

          <div class="p-5 border-t border-slate-100 flex gap-3">
            <button type="button" class="btn-ghost flex-1" @click="close">Cancelar</button>
            <button type="button" class="btn-primary flex-1" @click="submit">Registrar compra</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
