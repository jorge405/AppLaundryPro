<script setup>
import { ref, watch, computed } from 'vue'
import { useClientsStore } from '@/stores/clients'
import { useToast } from '@/composables/useToast'

const props = defineProps({ modelValue: Boolean, item: Object })
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useClientsStore()
const toast = useToast()

const emptyForm = () => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  tier: 'nuevo',
  notes: ''
})

const form = ref(emptyForm())
const errors = ref({})
const isEdit = computed(() => !!props.item?.id)

const tiers = [
  { id: 'nuevo', label: 'Nuevo', color: 'sky' },
  { id: 'recurrente', label: 'Recurrente', color: 'violet' },
  { id: 'vip', label: 'VIP', color: 'amber' }
]

watch(() => props.modelValue, (open) => {
  if (open) {
    form.value = props.item ? { ...props.item } : emptyForm()
    errors.value = {}
  }
})

function validate() {
  errors.value = {}
  if (!form.value.name?.trim()) errors.value.name = 'Nombre requerido'
  if (!form.value.phone?.trim()) errors.value.phone = 'Teléfono requerido'
  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return
  const payload = {
    name: form.value.name.trim(),
    phone: form.value.phone.trim(),
    email: form.value.email?.trim() || '',
    address: form.value.address?.trim() || '',
    tier: form.value.tier,
    notes: form.value.notes?.trim() || ''
  }
  if (isEdit.value) {
    store.updateClient(props.item.id, payload)
    toast.success('Cliente actualizado')
  } else {
    store.addClient(payload)
    toast.success('Cliente registrado')
  }
  emit('saved')
  emit('update:modelValue', false)
}

function close() { emit('update:modelValue', false) }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="close" />
        <div class="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 class="text-lg font-semibold text-slate-900">
              {{ isEdit ? 'Editar cliente' : 'Nuevo cliente' }}
            </h2>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">
            <div>
              <label class="label">Nombre completo *</label>
              <input v-model="form.name" class="input" placeholder="Ej: María García" />
              <p v-if="errors.name" class="mt-1 text-xs text-rose-500">{{ errors.name }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Teléfono *</label>
                <input v-model="form.phone" class="input" placeholder="+34 600 000 000" />
                <p v-if="errors.phone" class="mt-1 text-xs text-rose-500">{{ errors.phone }}</p>
              </div>
              <div>
                <label class="label">Email</label>
                <input v-model="form.email" type="email" class="input" placeholder="cliente@email.com" />
              </div>
            </div>

            <div>
              <label class="label">Dirección</label>
              <input v-model="form.address" class="input" placeholder="Calle, número, ciudad" />
            </div>

            <div>
              <label class="label">Tipo de cliente</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="t in tiers"
                  :key="t.id"
                  type="button"
                  @click="form.tier = t.id"
                  :class="[
                    'px-3 py-2 rounded-xl text-sm font-medium border transition',
                    form.tier === t.id
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  ]"
                >
                  {{ t.label }}
                </button>
              </div>
            </div>

            <div>
              <label class="label">Notas</label>
              <textarea v-model="form.notes" rows="3" class="input resize-none" placeholder="Preferencias, indicaciones..."></textarea>
            </div>
          </form>

          <div class="p-5 border-t border-slate-100 flex gap-3">
            <button type="button" class="btn-ghost flex-1" @click="close">Cancelar</button>
            <button type="button" class="btn-primary flex-1" @click="submit">
              {{ isEdit ? 'Guardar cambios' : 'Crear cliente' }}
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