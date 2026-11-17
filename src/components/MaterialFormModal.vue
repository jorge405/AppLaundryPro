<script setup>
import { ref, watch, computed } from 'vue'
import { MATERIAL_CATEGORIES, useMaterialsStore } from '@/stores/materials.js'
import { useSuppliersStore } from '@/stores/suppliers.js'
import { useBranchesStore } from '@/stores/branches.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useToast } from '@/composables/useToast'

const props = defineProps({ modelValue: Boolean, item: Object })
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useMaterialsStore()
const suppliers = useSuppliersStore()
const branches = useBranchesStore()
const settings = useSettingsStore()
const toast = useToast()

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = () => ({
  name: '',
  category: 'detergente',
  unit: 'L',
  minStock: 5,
  notes: '',
  branchId: '',
  quantity: 1,
  unitPrice: 0,
  purchaseDate: today(),
  supplier: '',
  showNewSupplier: false,
  newSupplierName: '',
  newSupplierPhone: ''
})

const form = ref(emptyForm())
const errors = ref({})

const isEdit = computed(() => !!props.item?.id)

watch(() => props.modelValue, (open) => {
  if (!open) return
  errors.value = {}
  if (props.item) {
    const it = props.item
    form.value = {
      ...emptyForm(),
      name: it.name || '',
      category: it.category || 'detergente',
      unit: it.unit || 'L',
      minStock: Number(it.minStock) || 0,
      notes: it.notes || '',
      branchId: it.branchId || branches.list[0]?.id || '',
      quantity: Number(it.stock) || 0,
      unitPrice: Number(it.price) || 0,
      supplier: it.supplier || '',
      showNewSupplier: false
    }
  } else {
    form.value = emptyForm()
  }
})

/* ====== Proveedores ====== */
const supplierOptions = computed(() => {
  const set = new Set([...suppliers.names, ...store.usedSuppliers])
  return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b))
})

function pickSupplier(value) {
  form.value.showNewSupplier = value === '__new__'
  form.value.supplier = form.value.showNewSupplier ? '' : (value || '')
}

/** Quita el proveedor seleccionado de la lista de proveedores registrados */
function removeSelectedSupplier() {
  const name = form.value.supplier
  if (!name) return
  const s = suppliers.suppliers.find(x => x.name === name)
  if (s) {
    suppliers.removeSupplier(s.id)
    toast.success(`Proveedor "${name}" eliminado de la lista`)
    form.value.supplier = ''
  }
}
const isRegisteredSupplier = computed(() =>
  suppliers.names.includes(form.value.supplier)
)

/* ====== Cálculos ====== */
const purchaseTotal = computed(() =>
  (Number(form.value.quantity) || 0) * (Number(form.value.unitPrice) || 0)
)
const supplierName = computed(() =>
  form.value.showNewSupplier ? form.value.newSupplierName.trim() : form.value.supplier
)

function validate() {
  errors.value = {}
  if (!form.value.name?.trim()) errors.value.name = 'Nombre requerido'
  if (!isEdit.value) {
    if ((Number(form.value.quantity) || 0) <= 0) errors.value.quantity = 'Cantidad mínima 1'
    if (!supplierName.value) errors.value.supplier = 'Selecciona o registra un proveedor'
  }
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

  const quantity = Number(form.value.quantity) || 0
  const unitPrice = Number(form.value.unitPrice) || 0

  if (isEdit.value) {
    store.updateMaterial(props.item.id, {
      name: form.value.name.trim(),
      category: form.value.category,
      unit: form.value.unit,
      minStock: Number(form.value.minStock) || 0,
      price: unitPrice,
      supplier,
      branchId: form.value.branchId || '',
      notes: form.value.notes?.trim() || ''
    })
    toast.success('Material actualizado')
  } else {
    store.addMaterial({
      name: form.value.name.trim(),
      category: form.value.category,
      unit: form.value.unit,
      minStock: Number(form.value.minStock) || 0,
      price: unitPrice,
      supplier,
      branchId: form.value.branchId || '',
      stock: quantity,
      notes: form.value.notes?.trim() || '',
      movements: [{
        id: `m${Date.now().toString(36)}`,
        type: 'entrada',
        date: form.value.purchaseDate || today(),
        supplier,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
        note: 'Compra inicial',
        createdAt: new Date().toISOString()
      }]
    })
    toast.success('Material registrado')
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
        <div class="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 class="text-lg font-semibold text-slate-900">
              {{ isEdit ? 'Editar material' : 'Nuevo material' }}
            </h2>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">
            <div>
              <label class="label">Nombre *</label>
              <input v-model="form.name" class="input" placeholder="Ej: Detergente líquido premium" />
              <p v-if="errors.name" class="mt-1 text-xs text-rose-500">{{ errors.name }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Categoría</label>
                <select v-model="form.category" class="input">
                  <option v-for="c in MATERIAL_CATEGORIES" :key="c.id" :value="c.id">{{ c.icon }} {{ c.label }}</option>
                </select>
              </div>
              <div>
                <label class="label">Unidad</label>
                <select v-model="form.unit" class="input">
                  <option value="L">Litros (L)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="ud">Unidades (ud)</option>
                </select>
              </div>
            </div>

            <!-- ===== PROVEEDOR ===== -->
            <div class="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-3">
              <label class="label mb-0">Proveedor</label>
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

              <button
                v-if="!form.showNewSupplier && isRegisteredSupplier"
                type="button"
                @click="removeSelectedSupplier"
                class="text-xs text-rose-500 font-medium"
              >
                × Quitar "{{ form.supplier }}" de la lista de proveedores
              </button>

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

            <!-- ===== COMPRA INICIAL ===== -->
            <div v-if="!isEdit" class="rounded-xl border border-slate-200 p-3 space-y-3">
              <p class="text-sm font-semibold text-slate-900">Compra inicial</p>
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
                <input v-model="form.purchaseDate" type="date" class="input" />
              </div>
              <div class="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-center justify-between">
                <span class="text-xs text-emerald-700 uppercase tracking-wide font-medium">
                  {{ form.quantity || 0 }} × {{ settings.format(form.unitPrice || 0) }}
                </span>
                <span class="font-bold text-emerald-700">{{ settings.format(purchaseTotal) }}</span>
              </div>
            </div>

            <!-- ===== EDICIÓN: stock actual + compras ===== -->
            <div v-else class="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Stock actual</span>
                <span class="font-semibold text-slate-900">{{ props.item.stock }} {{ props.item.unit }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Precio unitario</span>
                <input v-model.number="form.unitPrice" type="number" min="0" step="0.01" class="input w-36 text-right" />
              </div>
              <p class="text-xs text-slate-400">
                Para sumar stock usa el botón «Agregar stock» en la tarjeta del material.
              </p>
              <div v-if="(props.item.movements || []).length">
                <p class="text-xs uppercase tracking-wide text-slate-500 mb-1">Historial de movimientos</p>
                <div class="space-y-1">
                  <div
                    v-for="mv in props.item.movements"
                    :key="mv.id"
                    class="flex items-center justify-between text-xs bg-white rounded-lg px-2.5 py-1.5 border border-slate-100"
                  >
                    <span class="text-slate-600 truncate">
                      {{ mv.type === 'entrada' ? '➕' : '➖' }} {{ mv.date }} ·
                      {{ mv.supplier || 'Sin proveedor' }} · {{ mv.quantity }} {{ props.item.unit }}
                    </span>
                    <span class="font-semibold text-slate-700">{{ settings.format(mv.subtotal) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Stock mínimo</label>
                <input v-model.number="form.minStock" type="number" min="0" step="0.1" class="input" />
              </div>
              <div>
                <label class="label">Sucursal</label>
                <select v-model="form.branchId" class="input">
                  <option value="">Sin sucursal</option>
                  <option v-for="b in branches.list" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="label">Notas</label>
              <textarea v-model="form.notes" rows="3" class="input resize-none" placeholder="Instrucciones, caducidad, dilución..."></textarea>
            </div>
          </form>

          <div class="p-5 border-t border-slate-100 flex gap-3">
            <button type="button" class="btn-ghost flex-1" @click="close">Cancelar</button>
            <button type="button" class="btn-primary flex-1" @click="submit">
              {{ isEdit ? 'Guardar cambios' : 'Crear material' }}
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
</style>
