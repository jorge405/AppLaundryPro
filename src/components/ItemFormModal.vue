<script setup>
import { ref, watch, computed } from 'vue'
import { CATEGORIES, STATUSES, useItemsStore } from '@/stores/Items.js'
import { useToast } from '@/composables/useToast'

const props = defineProps({ modelValue: Boolean, item: Object })
const emit = defineEmits(['update:modelValue', 'saved'])

const items = useItemsStore()
const toast = useToast()

const emptyForm = () => ({
  name: '',
  category: 'ropa',
  status: 'pendiente',
  quantity: 1,
  price: 0,
  notes: '',
  pickup: '',
  delivery: ''
})

const form = ref(emptyForm())
const errors = ref({})

const isEdit = computed(() => !!props.item?.id)
const title = computed(() => isEdit.value ? 'Editar prenda' : 'Nueva prenda')

watch(() => props.modelValue, (open) => {
  if (open) {
    form.value = props.item ? { ...props.item } : emptyForm()
    errors.value = {}
  }
})

function validate() {
  errors.value = {}
  if (!form.value.name?.trim()) errors.value.name = 'Nombre requerido'
  if (form.value.quantity < 1) errors.value.quantity = 'Mínimo 1'
  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return
  const payload = {
    name: form.value.name.trim(),
    category: form.value.category,
    status: form.value.status,
    quantity: Number(form.value.quantity),
    price: Number(form.value.price) || 0,
    notes: form.value.notes?.trim() || '',
    pickup: form.value.pickup,
    delivery: form.value.delivery
  }
  if (isEdit.value) {
    items.updateItem(props.item.id, payload)
    toast.success('Prenda actualizada')
  } else {
    items.addItem(payload)
    toast.success('Prenda registrada')
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
            <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">
            <div>
              <label class="label">Nombre *</label>
              <input v-model="form.name" class="input" placeholder="Ej: Traje azul marino" />
              <p v-if="errors.name" class="mt-1 text-xs text-rose-500">{{ errors.name }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Categoría</label>
                <select v-model="form.category" class="input">
                  <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.icon }} {{ c.label }}</option>
                </select>
              </div>
              <div>
                <label class="label">Estado</label>
                <select v-model="form.status" class="input">
                  <option v-for="s in STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Cantidad</label>
                <input v-model.number="form.quantity" type="number" min="1" class="input" />
                <p v-if="errors.quantity" class="mt-1 text-xs text-rose-500">{{ errors.quantity }}</p>
              </div>
              <div>
                <label class="label">Precio (€)</label>
                <input v-model.number="form.price" type="number" min="0" step="0.01" class="input" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Recogida</label>
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
              {{ isEdit ? 'Guardar cambios' : 'Crear prenda' }}
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