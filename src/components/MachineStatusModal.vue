<script setup>
import { ref, watch, computed } from 'vue'
import { MACHINE_STATUSES, useMachinesStore } from '@/stores/machines.js'
import { useSuppliersStore } from '@/stores/suppliers.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useToast } from '@/composables/useToast'

const props = defineProps({ modelValue: Boolean, machine: Object })
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useMachinesStore()
const suppliers = useSuppliersStore()
const settings = useSettingsStore()
const toast = useToast()

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = () => ({
  status: 'operativa',
  // mantenimiento
  sentDate: today(),
  pickupDate: '',
  place: '',
  supplier: '',
  cost: 0,
  notes: '',
  // avería
  fault: '',
  detectedDate: '',
  reportedBy: '',
  inWorkshop: false,
  showNewSupplier: false,
  newSupplierName: '',
  newSupplierPhone: ''
})

const form = ref(emptyForm())
const errors = ref({})

watch(() => props.modelValue, (open) => {
  if (!open) return
  errors.value = {}
  const m = props.machine
  form.value = {
    ...emptyForm(),
    status: m?.status || 'operativa',
    sentDate: m?.maintenance?.sentDate || today(),
    pickupDate: m?.maintenance?.pickupDate || '',
    place: m?.maintenance?.place || m?.location || '',
    supplier: m?.maintenance?.supplier || '',
    cost: Number(m?.maintenance?.cost) || 0,
    notes: m?.maintenance?.notes || '',
    fault: m?.breakdown?.fault || '',
    detectedDate: m?.breakdown?.detectedDate || today(),
    reportedBy: m?.breakdown?.reportedBy || '',
    inWorkshop: m?.breakdown?.inWorkshop ?? false
  }
})

const supplierOptions = computed(() => {
  const set = new Set([...suppliers.names])
  return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b))
})

function pickSupplier(value) {
  form.value.showNewSupplier = value === '__new__'
  if (form.value.showNewSupplier) form.value.supplier = ''
}

const supplierName = computed(() =>
  form.value.showNewSupplier ? form.value.newSupplierName.trim() : form.value.supplier
)

const isRegisteredSupplier = computed(() => suppliers.names.includes(form.value.supplier))

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

const statusLabel = computed(() =>
  MACHINE_STATUSES.find(s => s.id === form.value.status)?.label || form.value.status
)

function validate() {
  errors.value = {}
  if (form.value.status === 'mantenimiento') {
    if (!form.value.sentDate) errors.value.sentDate = 'Indica la fecha en que se dejó'
    if (!form.value.place?.trim()) errors.value.place = 'Indica dónde se dejó la máquina'
    if (!supplierName.value) errors.value.supplier = 'Indica el proveedor'
    if ((Number(form.value.cost) || 0) < 0) errors.value.cost = 'Precio inválido'
  }
  if (form.value.status === 'averiada') {
    if (!form.value.fault?.trim()) errors.value.fault = 'Describe el fallo'
    if (!form.value.detectedDate) errors.value.detectedDate = 'Indica la fecha del fallo'
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

  store.setStatus(props.machine.id, form.value.status, {
    maintenance: {
      sentDate: form.value.sentDate,
      pickupDate: form.value.pickupDate,
      place: form.value.place?.trim(),
      supplier,
      cost: Number(form.value.cost) || 0,
      notes: form.value.notes?.trim()
    },
    breakdown: {
      fault: form.value.fault?.trim(),
      detectedDate: form.value.detectedDate,
      reportedBy: form.value.reportedBy?.trim(),
      place: form.value.place?.trim(),
      supplier,
      cost: Number(form.value.cost) || 0,
      inWorkshop: form.value.inWorkshop,
      notes: form.value.notes?.trim()
    }
  })

  toast.success(`Estado actualizado: ${statusLabel.value}`)
  emit('saved')
  emit('update:modelValue', false)
}

function close() { emit('update:modelValue', false) }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue && machine" class="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="close" />
        <div class="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Estado de la máquina</h2>
              <p class="text-xs text-slate-500 mt-0.5">{{ machine.name }} · {{ machine.code }}</p>
            </div>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">
            <!-- Estado -->
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="s in MACHINE_STATUSES"
                :key="s.id"
                type="button"
                @click="form.status = s.id"
                :class="[
                  'rounded-xl border p-3 text-left transition-colors',
                  form.status === s.id
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
                    : 'border-slate-200 hover:bg-slate-50'
                ]"
              >
                <p class="text-sm font-semibold" :class="form.status === s.id ? 'text-indigo-700' : 'text-slate-700'">
                  {{ s.label }}
                </p>
              </button>
            </div>

            <!-- ===== MANTENIMIENTO ===== -->
            <div v-if="form.status === 'mantenimiento'" class="rounded-xl bg-amber-50/60 border border-amber-200 p-4 space-y-3">
              <p class="text-sm font-semibold text-amber-900">Datos del mantenimiento</p>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Se dejó el *</label>
                  <input v-model="form.sentDate" type="date" class="input" />
                  <p v-if="errors.sentDate" class="mt-1 text-xs text-rose-500">{{ errors.sentDate }}</p>
                </div>
                <div>
                  <label class="label">Se recoge el</label>
                  <input v-model="form.pickupDate" type="date" class="input" />
                </div>
              </div>

              <div>
                <label class="label">Lugar donde se dejó *</label>
                <input v-model="form.place" class="input" placeholder="Ej: Taller de mantenimiento central" />
                <p v-if="errors.place" class="mt-1 text-xs text-rose-500">{{ errors.place }}</p>
              </div>

              <!-- Proveedor -->
              <div>
                <label class="label">Proveedor *</label>
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
                  <input v-model="form.newSupplierName" class="input" placeholder="Nombre del proveedor" />
                  <input v-model="form.newSupplierPhone" type="tel" class="input" placeholder="Teléfono (opcional)" />
                  <button type="button" @click="pickSupplier('')" class="text-xs text-indigo-600 font-medium">
                    ← Volver a la lista de proveedores
                  </button>
                </div>
                <p v-if="errors.supplier" class="text-xs text-rose-500">{{ errors.supplier }}</p>
              </div>

              <div>
                <label class="label">Precio del mantenimiento</label>
                <input v-model.number="form.cost" type="number" min="0" step="0.01" class="input" />
              </div>

              <div>
                <label class="label">Notas</label>
                <textarea v-model="form.notes" rows="2" class="input resize-none" placeholder="Trabajos realizados, repuestos..."></textarea>
              </div>
            </div>

            <!-- ===== AVERÍA ===== -->
            <div v-else-if="form.status === 'averiada'" class="rounded-xl bg-rose-50/60 border border-rose-200 p-4 space-y-3">
              <p class="text-sm font-semibold text-rose-900">Datos de la avería</p>

              <div>
                <label class="label">Fallo *</label>
                <textarea v-model="form.fault" rows="2" class="input resize-none" placeholder="Ej: No centrifuga, hace ruido al girar..."></textarea>
                <p v-if="errors.fault" class="mt-1 text-xs text-rose-500">{{ errors.fault }}</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Fecha del fallo *</label>
                  <input v-model="form.detectedDate" type="date" class="input" />
                  <p v-if="errors.detectedDate" class="mt-1 text-xs text-rose-500">{{ errors.detectedDate }}</p>
                </div>
                <div>
                  <label class="label">Reportado por</label>
                  <input v-model="form.reportedBy" class="input" placeholder="Ej: Operador turno tarde" />
                </div>
              </div>

              <div>
                <label class="label">Lugar</label>
                <input v-model="form.place" class="input" placeholder="Ej: Sala de lavado" />
              </div>

              <!-- Proveedor -->
              <div>
                <label class="label">Proveedor / técnico</label>
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
                  <input v-model="form.newSupplierName" class="input" placeholder="Nombre del proveedor" />
                  <input v-model="form.newSupplierPhone" type="tel" class="input" placeholder="Teléfono (opcional)" />
                  <button type="button" @click="pickSupplier('')" class="text-xs text-indigo-600 font-medium">
                    ← Volver a la lista de proveedores
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Costo estimado</label>
                  <input v-model.number="form.cost" type="number" min="0" step="0.01" class="input" />
                </div>
                <label class="flex items-center gap-2 mt-6 text-sm text-slate-700">
                  <input v-model="form.inWorkshop" type="checkbox" class="w-4 h-4 rounded border-slate-300" />
                  Llevada a taller
                </label>
              </div>

              <div>
                <label class="label">Notas</label>
                <textarea v-model="form.notes" rows="2" class="input resize-none" placeholder="Detalles adicionales..."></textarea>
              </div>
            </div>

            <!-- ===== OPERATIVA / INACTIVA ===== -->
            <div v-else class="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <p class="text-sm font-semibold text-slate-900">
                {{ form.status === 'operativa' ? 'La máquina vuelve a servicio' : 'Máquina inactiva' }}
              </p>
              <p class="text-xs text-slate-500">
                {{
                  form.status === 'operativa'
                    ? 'Se conserva el historial del mantenimiento o la avería para su consulta.'
                    : 'La máquina queda fuera de operación hasta cambiar su estado.'
                }}
              </p>
              <div>
                <label class="label">Notas</label>
                <textarea v-model="form.notes" rows="2" class="input resize-none" placeholder="Observaciones..."></textarea>
              </div>
            </div>
          </form>

          <div class="p-5 border-t border-slate-100 flex gap-3">
            <button type="button" class="btn-ghost flex-1" @click="close">Cancelar</button>
            <button type="button" class="btn-primary flex-1" @click="submit">Guardar estado</button>
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
