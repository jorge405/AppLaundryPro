<script setup>
import { ref, watch, computed } from 'vue'
import { useEmployeesStore } from '@/stores/employees.js'
import { useBranchesStore } from '@/stores/branches.js'
import { ROLES, ROLE_LABELS } from '@/stores/auth.js'
import { useToast } from '@/composables/useToast'

const props = defineProps({ modelValue: Boolean, employee: Object })
const emit = defineEmits(['update:modelValue', 'saved'])

const employees = useEmployeesStore()
const branches = useBranchesStore()
const toast = useToast()

const emptyForm = () => ({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: ROLES.EMPLOYEE,
  branchId: '',
  branchName: '',
  position: '',
  notes: '',
  active: true
})

const form = ref(emptyForm())
const errors = ref({})
const isEdit = computed(() => !!props.employee?.id)

watch(() => props.modelValue, (open) => {
  if (!open) return
  errors.value = {}
  form.value = props.employee ? { ...emptyForm(), ...props.employee } : emptyForm()
})

const roleOptions = [
  { id: ROLES.EMPLOYEE, label: ROLE_LABELS[ROLES.EMPLOYEE], hint: 'Crea prendas, materiales, máquinas y gestiona clientes.' },
  { id: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN], hint: 'Sucursales, reportes y gestión de empleados.' }
]

function onBranchChange(id) {
  const b = branches.getById(id)
  form.value.branchName = b?.name || ''
}

function validate() {
  errors.value = {}
  if (!form.value.name?.trim()) errors.value.name = 'Nombre requerido'
  if (!form.value.email?.trim()) errors.value.email = 'Email requerido'
  else if (!/^\S+@\S+\.\S+$/.test(form.value.email.trim())) errors.value.email = 'Email no válido'
  if (!isEdit.value && !form.value.password?.trim()) errors.value.password = 'Contraseña requerida'
  const dup = employees.list.find(
    e => e.id !== props.employee?.id && (e.email || '').toLowerCase() === form.value.email.trim().toLowerCase()
  )
  if (dup) errors.value.email = 'Ya existe un empleado con ese email'
  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return
  const payload = {
    name: form.value.name.trim(),
    email: form.value.email.trim().toLowerCase(),
    password: form.value.password?.trim() || (isEdit.value ? props.employee.password : '1234'),
    phone: form.value.phone?.trim() || '',
    role: form.value.role || ROLES.EMPLOYEE,
    branchId: form.value.branchId || '',
    branchName: form.value.branchName || '',
    position: form.value.position?.trim() || '',
    notes: form.value.notes?.trim() || '',
    active: form.value.active !== false
  }
  if (isEdit.value) {
    employees.updateEmployee(props.employee.id, payload)
    toast.success('Empleado actualizado')
  } else {
    employees.addEmployee(payload)
    toast.success('Empleado registrado')
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
              {{ isEdit ? 'Editar empleado' : 'Nuevo empleado' }}
            </h2>
            <button @click="close" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">
            <div>
              <label class="label">Nombre completo *</label>
              <input v-model="form.name" class="input" placeholder="Ej: Juan Pérez" />
              <p v-if="errors.name" class="mt-1 text-xs text-rose-500">{{ errors.name }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Email *</label>
                <input v-model="form.email" type="email" class="input" placeholder="nombre@laundrypro.app" />
                <p v-if="errors.email" class="mt-1 text-xs text-rose-500">{{ errors.email }}</p>
              </div>
              <div>
                <label class="label">{{ isEdit ? 'Nueva contraseña' : 'Contraseña *' }}</label>
                <input v-model="form.password" type="text" class="input" placeholder="1234" />
                <p v-if="errors.password" class="mt-1 text-xs text-rose-500">{{ errors.password }}</p>
                <p v-if="isEdit" class="mt-1 text-xs text-slate-400">Déjalo vacío para mantener la actual.</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Teléfono</label>
                <input v-model="form.phone" class="input" placeholder="700-00000" />
              </div>
              <div>
                <label class="label">Puesto</label>
                <input v-model="form.position" class="input" placeholder="Ej: Operador de lavado" />
              </div>
            </div>

            <div>
              <label class="label">Rol</label>
              <div class="space-y-2">
                <label
                  v-for="r in roleOptions"
                  :key="r.id"
                  class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition"
                  :class="form.role === r.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'"
                >
                  <input v-model="form.role" type="radio" :value="r.id" class="mt-0.5" />
                  <span>
                    <span class="block text-sm font-medium text-slate-800">{{ r.label }}</span>
                    <span class="block text-xs text-slate-500">{{ r.hint }}</span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label class="label">Sucursal asignada</label>
              <select
                :value="form.branchId || ''"
                class="input"
                @change="onBranchChange($event.target.value); form.branchId = $event.target.value"
              >
                <option value="">Sin sucursal asignada</option>
                <option v-for="b in branches.list" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>

            <div>
              <label class="label">Notas</label>
              <textarea v-model="form.notes" class="input resize-none" placeholder="Horarios, funciones, etc." />
            </div>

            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input v-model="form.active" type="checkbox" class="w-4 h-4 rounded border-slate-300" />
              Empleado activo (puede iniciar sesión)
            </label>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="close" class="btn-ghost flex-1">Cancelar</button>
              <button type="submit" class="btn-primary flex-1">{{ isEdit ? 'Guardar cambios' : 'Registrar empleado' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
