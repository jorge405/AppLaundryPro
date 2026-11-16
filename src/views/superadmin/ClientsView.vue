<script setup>
import { ref, computed } from 'vue'
import { useSuperAdminStore } from '@/stores/superadmin'
import { usePlansStore } from '@/stores/plans'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { formatDate } from '@/utils/format'

const sa = useSuperAdminStore()
const plans = usePlansStore()
const settings = useSettingsStore()
const toast = useToast()
const { confirm } = useConfirm()

const search = ref('')
const filterStatus = ref('all')
const modalOpen = ref(false)
const editing = ref(null)
const errors = ref({})

const form = ref(emptyForm())

function emptyForm() {
  return {
    name: '',
    email: '',
    password: '',
    planId: plans.plans[0]?.id || '',
    durationDays: 365,
    notes: ''
  }
}

const filtered = computed(() => {
  let list = sa.clients
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  }
  if (filterStatus.value === 'active') list = list.filter(c => !sa.isExpired(c))
  if (filterStatus.value === 'expired') list = list.filter(c => sa.isExpired(c))
  return list
})

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  errors.value = {}
  modalOpen.value = true
}

function openEdit(c) {
  editing.value = c
  form.value = {
    name: c.name,
    email: c.email,
    password: c.password,
    planId: c.planId,
    durationDays: c.durationDays || 365,
    notes: c.notes || ''
  }
  errors.value = {}
  modalOpen.value = true
}

function validate() {
  errors.value = {}
  if (!form.value.name?.trim()) errors.value.name = 'Requerido'
  if (!form.value.email?.trim()) errors.value.email = 'Requerido'
  if (!form.value.password?.trim()) errors.value.password = 'Requerido'
  if (!form.value.planId) errors.value.planId = 'Selecciona un plan'
  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return

  const plan = plans.getById(form.value.planId)
  if (!plan) return

  if (editing.value) {
    sa.updateClient(editing.value.id, {
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      planId: plan.id,
      planName: plan.name,
      planPrice: plan.price,
      durationDays: Number(form.value.durationDays) || 365,
      notes: form.value.notes
    })
    toast.success('Cliente actualizado')
  } else {
    // Validar email único
    if (sa.clients.some(c => c.email.toLowerCase() === form.value.email.trim().toLowerCase())) {
      toast.error('Ese email ya está registrado')
      return
    }
    sa.addClient({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      planId: plan.id,
      planName: plan.name,
      planPrice: plan.price,
      durationDays: Number(form.value.durationDays) || 365,
      notes: form.value.notes
    })
    toast.success('Cliente creado')
  }
  modalOpen.value = false
}

async function removeClient(id) {
  const c = sa.getById(id)
  const ok = await confirm({
    title: 'Eliminar cliente',
    message: `¿Eliminar "${c?.name}"? Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (ok) {
    sa.removeClient(id)
    toast.success('Cliente eliminado')
  }
}

function renew(c) {
  sa.renewYear(c.id)
  toast.success(`${c.name} renovado por 1 año`)
}

function fmt(n) { return settings.format(n || 0) }
function planColor(id) {
  const p = plans.getById(id)
  const map = {
    sky: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    violet: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
  }
  return map[p?.color] || map.indigo
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white p-6 lg:p-10">
    <div class="max-w-7xl mx-auto space-y-6">

      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold">Clientes SaaS</h1>
          <p class="text-white/50 text-sm mt-1">Gestiona las cuentas y sus planes</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="openCreate" class="px-4 py-2 rounded-xl text-sm font-semibold
                  bg-gradient-to-r from-fuchsia-600 to-purple-500 shadow-lg shadow-fuchsia-500/30
                  hover:brightness-110 transition">
            + Nuevo cliente
          </button>
          <RouterLink :to="{ name: 'sa-dashboard' }" class="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition">
            ← Volver
          </RouterLink>
        </div>
      </div>

      <!-- Filtros -->
      <div class="flex flex-wrap gap-3">
        <input v-model="search" placeholder="Buscar por nombre o email..."
          class="flex-1 min-w-[240px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" />
        <select v-model="filterStatus"
          class="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none">
          <option value="all" class="bg-slate-900">Todos</option>
          <option value="active" class="bg-slate-900">Activos</option>
          <option value="expired" class="bg-slate-900">Vencidos</option>
        </select>
      </div>

      <!-- Lista -->
      <div v-if="filtered.length" class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div v-for="c in filtered" :key="c.id" class="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur hover:bg-white/[.07] transition">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-purple-500 grid place-items-center font-semibold shrink-0">
                {{ c.name[0].toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="font-semibold truncate">{{ c.name }}</p>
                <p class="text-xs text-white/50 truncate">{{ c.email }}</p>
              </div>
            </div>
            <span :class="['px-2.5 py-1 rounded-full text-xs font-medium border shrink-0', planColor(c.planId)]">
              {{ c.planName }}
            </span>
          </div>

          <div class="space-y-2 text-sm mb-4">
            <div class="flex justify-between">
              <span class="text-white/50">Contraseña:</span>
              <span class="font-mono text-xs">{{ c.password }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/50">Inicio:</span>
              <span>{{ formatDate(c.startedAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/50">Vence:</span>
              <span :class="sa.isExpired(c) ? 'text-rose-400' : 'text-emerald-400'">
                {{ formatDate(c.expiresAt) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/50">Estado:</span>
              <span :class="sa.isExpired(c) ? 'text-rose-400' : 'text-emerald-400'">
                {{ sa.isExpired(c) ? 'Vencido' : `${sa.daysLeft(c)} días restantes` }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/50">Precio:</span>
              <span>{{ fmt(c.planPrice) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-3 border-t border-white/10">
            <button @click="renew(c)" class="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition">
              + 1 año
            </button>
            <button @click="openEdit(c)" class="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition">
              Editar
            </button>
            <button @click="removeClient(c.id)" class="px-3 py-2 rounded-lg text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition">
              🗑
            </button>
          </div>
        </div>
      </div>

      <div v-else class="rounded-2xl bg-white/5 border border-white/10 p-16 text-center">
        <p class="text-white/50">Sin clientes registrados</p>
        <button @click="openCreate" class="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-fuchsia-600 to-purple-500 shadow-lg shadow-fuchsia-500/30">
          Crear primer cliente
        </button>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="modalOpen" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="modalOpen = false" />
          <div class="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-white/10 shadow-2xl max-h-[92vh] flex flex-col text-white">
            <div class="flex items-center justify-between p-5 border-b border-white/10">
              <h2 class="text-lg font-semibold">{{ editing ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
              <button @click="modalOpen = false" class="p-2 rounded-lg text-white/50 hover:bg-white/10">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-1.5">Nombre *</label>
                <input v-model="form.name" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" placeholder="Ej: Tintorería El Sol" />
                <p v-if="errors.name" class="mt-1 text-xs text-rose-400">{{ errors.name }}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-1.5">Email *</label>
                  <input v-model="form.email" type="email" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" placeholder="cliente@email.com" />
                  <p v-if="errors.email" class="mt-1 text-xs text-rose-400">{{ errors.email }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-1.5">Contraseña *</label>
                  <input v-model="form.password" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" placeholder="••••••" />
                  <p v-if="errors.password" class="mt-1 text-xs text-rose-400">{{ errors.password }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-1.5">Plan *</label>
                  <select v-model="form.planId" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none">
                    <option v-for="p in plans.plans" :key="p.id" :value="p.id" class="bg-slate-900">
                      {{ p.name }} · {{ fmt(p.price) }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-1.5">Duración (días)</label>
                  <input v-model.number="form.durationDays" type="number" min="1" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-1.5">Notas</label>
                <textarea v-model="form.notes" rows="3" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition resize-none" placeholder="Notas internas"></textarea>
              </div>
            </form>

            <div class="p-5 border-t border-white/10 flex gap-3">
              <button type="button" @click="modalOpen = false" class="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">
                Cancelar
              </button>
              <button type="button" @click="submit" class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-fuchsia-600 to-purple-500 shadow-lg shadow-fuchsia-500/30 hover:brightness-110 transition">
                {{ editing ? 'Guardar cambios' : 'Crear cliente' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>