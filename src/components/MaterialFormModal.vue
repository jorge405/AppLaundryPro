<script setup>
import { ref, watch, computed } from 'vue'
import { MATERIAL_CATEGORIES, useMaterialsStore } from '@/stores/materials.js'
import { useToast } from '@/composables/useToast'

const props = defineProps({ modelValue: Boolean, item: Object })
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useMaterialsStore()
const toast = useToast()

const emptyForm = () => ({
  name: '',
  category: 'detergente',
  stock: 0,
  minStock: 5,
  unit: 'L',
  price: 0,
  supplier: '',
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
  if (form.value.stock < 0) errors.value.stock = 'No puede ser negativo'
  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return
  const payload = {
    name: form.value.name.trim(),
    category: form.value.category,
    stock: Number(form.value.stock),
    minStock: Number(form.value.minStock),
    unit: form.value.unit,
    price: Number(form.value.price) || 0,
    supplier: form.value.supplier?.trim() || '',
    notes: form.value.notes?.trim() || ''
  }
  if (isEdit.value) {
    store.updateMaterial(props.item.id, payload)
    toast.success('Material actualizado')
  } else {
    store.addMaterial(payload)
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
      <div v-if="modelValue" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
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

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Stock actual</label>
                <input v-model.number="form.stock" type="number" min="0" step="0.1" class="input" />
                <p v-if="errors.stock" class="mt-1 text-xs text-rose-500">{{ errors.stock }}</p>
              </div>
              <div>
                <label class="label">Stock mínimo</label>
                <input v-model.number="form.minStock" type="number" min="0" step="0.1" class="input" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Precio unitario (€)</label>
                <input v-model.number="form.price" type="number" min="0" step="0.01" class="input" />
              </div>
              <div>
                <label class="label">Proveedor</label>
                <input v-model="form.supplier" class="input" placeholder="Proveedor" />
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