<script setup>
import { ref, watch, computed } from 'vue'
import { MACHINE_TYPES, MACHINE_STATUSES, useMachinesStore } from '@/stores/machines.js'
import { useToast } from '@/composables/useToast'

const props = defineProps({ modelValue: Boolean, item: Object })
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useMachinesStore()
const toast = useToast()

const emptyForm = () => ({
  name: '',
  type: 'lavadora',
  brand: '',
  model: '',
  serial: '',
  status: 'operativa',
  location: '',
  purchaseDate: '',
  nextMaintenance: '',
  notes: ''
})

const form = ref(emptyForm())
const errors = ref({})
const isEdit = computed(() => !!props.item?.id)

watch(() => props.modelValue, (open) => {
  if (open) {
    form.value = props.item ? { ...props.item } : emptyForm()
    errors.value = {}
  }
})

function validate() {
  errors.value = {}
  if (!form.value.name?.trim()) errors.value.name = 'Nombre requerido'
  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return
  const payload = {
    name: form.value.name.trim(),
    type: form.value.type,
    brand: form.value.brand?.trim() || '',
    model: form.value.model?.trim() || '',
    serial: form.value.serial?.trim() || '',
    status: form.value.status,
    location: form.value.location?.trim() || '',
    purchaseDate: form.value.purchaseDate,
    nextMaintenance: form.value.nextMaintenance,
    notes: form.value.notes?.trim() || ''
  }
  if (isEdit.value) {
    store.updateMachine(props.item.id, payload)
    toast.success('Máquina actualizada')
  } else {
    store.addMachine(payload)
    toast.success('Máquina registrada')
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
              {{ isEdit ? 'Editar máquina' : 'Nueva máquina' }}
            </h2>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">
            <div>
              <label class="label">Nombre *</label>
              <input v-model="form.name" class="input" placeholder="Ej: Lavadora industrial 1" />
              <p v-if="errors.name" class="mt-1 text-xs text-rose-500">{{ errors.name }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Tipo</label>
                <select v-model="form.type" class="input">
                  <option v-for="t in MACHINE_TYPES" :key="t.id" :value="t.id">{{ t.icon }} {{ t.label }}</option>
                </select>
              </div>
              <div>
                <label class="label">Estado</label>
                <select v-model="form.status" class="input">
                  <option v-for="s in MACHINE_STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Marca</label>
                <input v-model="form.brand" class="input" placeholder="Ej: Samsung" />
              </div>
              <div>
                <label class="label">Modelo</label>
                <input v-model="form.model" class="input" placeholder="Ej: WF45R6100" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Nº de serie</label>
                <input v-model="form.serial" class="input" placeholder="SN-XXXX" />
              </div>
              <div>
                <label class="label">Ubicación</label>
                <input v-model="form.location" class="input" placeholder="Ej: Sala principal" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Fecha de compra</label>
                <input v-model="form.purchaseDate" type="date" class="input" />
              </div>
              <div>
                <label class="label">Próximo mantenimiento</label>
                <input v-model="form.nextMaintenance" type="date" class="input" />
              </div>
            </div>

            <div>
              <label class="label">Notas</label>
              <textarea v-model="form.notes" rows="3" class="input resize-none" placeholder="Observaciones, historial..."></textarea>
            </div>
          </form>

          <div class="p-5 border-t border-slate-100 flex gap-3">
            <button type="button" class="btn-ghost flex-1" @click="close">Cancelar</button>
            <button type="button" class="btn-primary flex-1" @click="submit">
              {{ isEdit ? 'Guardar cambios' : 'Crear máquina' }}
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