<script setup>
import { ref, watch, computed } from 'vue'
import { useBranchesStore } from '@/stores/branches.js'
import { useSuperAdminStore } from '@/stores/superadmin.js'
import { useAuthStore } from '@/stores/auth.js'
import { useToast } from '@/composables/useToast'

const props = defineProps({ modelValue: Boolean, branch: Object })
const emit = defineEmits(['update:modelValue', 'saved'])

const branches = useBranchesStore()
const sa = useSuperAdminStore()
const auth = useAuthStore()
const toast = useToast()

const emptyForm = () => ({
  name: '',
  companyId: auth.companyId || '',
  companyName: auth.companyName || '',
  address: '',
  phone: '',
  openTime: '08:00',
  closeTime: '18:00',
  manager: auth.user?.name || '',
  notes: '',
  active: true
})

const form = ref(emptyForm())
const errors = ref({})
const isEdit = computed(() => !!props.branch?.id)

watch(() => props.modelValue, (open) => {
  if (!open) return
  errors.value = {}
  form.value = props.branch ? { ...emptyForm(), ...props.branch } : emptyForm()
})

const companies = computed(() => sa.clients)

function onCompanyChange(id) {
  const c = companies.value.find(x => x.id === id)
  form.value.companyName = c?.name || ''
}

function validate() {
  errors.value = {}
  if (!form.value.name?.trim()) errors.value.name = 'Nombre de la sucursal requerido'
  if (!form.value.address?.trim()) errors.value.address = 'Dirección requerida'
  if (!form.value.manager?.trim()) errors.value.manager = 'Indica el responsable a cargo'
  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return
  const payload = {
    name: form.value.name.trim(),
    companyId: form.value.companyId || '',
    companyName: form.value.companyName || '',
    address: form.value.address.trim(),
    phone: form.value.phone?.trim() || '',
    openTime: form.value.openTime || '08:00',
    closeTime: form.value.closeTime || '18:00',
    manager: form.value.manager.trim(),
    notes: form.value.notes?.trim() || '',
    active: form.value.active !== false
  }
  if (isEdit.value) {
    branches.updateBranch(props.branch.id, payload)
    toast.success('Sucursal actualizada')
  } else {
    branches.addBranch(payload)
    toast.success('Sucursal registrada')
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
              {{ isEdit ? 'Editar sucursal' : 'Nueva sucursal' }}
            </h2>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">
            <div>
              <label class="label">Nombre de la sucursal *</label>
              <input v-model="form.name" class="input" placeholder="Ej: Sucursal Central" />
              <p v-if="errors.name" class="mt-1 text-xs text-rose-500">{{ errors.name }}</p>
            </div>

            <div>
              <label class="label">Empresa</label>
              <select
                :value="form.companyId || ''"
                class="input"
                @change="onCompanyChange($event.target.value); form.companyId = $event.target.value"
              >
                <option value="">Sin empresa asignada</option>
                <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <p class="mt-1 text-xs text-slate-400">
                La sucursal queda vinculada a la empresa para el superadmin de empresas.
              </p>
            </div>

            <div>
              <label class="label">Dirección *</label>
              <input v-model="form.address" class="input" placeholder="Ej: Av. Ballivián 1420, La Paz" />
              <p v-if="errors.address" class="mt-1 text-xs text-rose-500">{{ errors.address }}</p>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="label">Ingreso</label>
                <input v-model="form.openTime" type="time" class="input" />
              </div>
              <div>
                <label class="label">Salida</label>
                <input v-model="form.closeTime" type="time" class="input" />
              </div>
              <div>
                <label class="label">Teléfono</label>
                <input v-model="form.phone" type="tel" class="input" placeholder="700-00000" />
              </div>
            </div>

            <div>
              <label class="label">Responsable a cargo *</label>
              <input v-model="form.manager" class="input" placeholder="Ej: María Ramírez" />
              <p v-if="errors.manager" class="mt-1 text-xs text-rose-500">{{ errors.manager }}</p>
            </div>

            <div>
              <label class="label">Notas</label>
              <textarea v-model="form.notes" rows="2" class="input resize-none" placeholder="Capacidad, equipos, observaciones..."></textarea>
            </div>

            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input v-model="form.active" type="checkbox" class="w-4 h-4 rounded border-slate-300" />
              Sucursal activa
            </label>
          </form>

          <div class="p-5 border-t border-slate-100 flex gap-3">
            <button type="button" class="btn-ghost flex-1" @click="close">Cancelar</button>
            <button type="button" class="btn-primary flex-1" @click="submit">
              {{ isEdit ? 'Guardar cambios' : 'Crear sucursal' }}
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
