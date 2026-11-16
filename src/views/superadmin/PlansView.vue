<script setup>
import { ref } from 'vue'
import { usePlansStore } from '@/stores/plans'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const plans = usePlansStore()
const settings = useSettingsStore()
const toast = useToast()
const { confirm } = useConfirm()

const modalOpen = ref(false)
const editing = ref(null)
const errors = ref({})

const form = ref(emptyForm())

function emptyForm() {
  return {
    name: '',
    price: 0,
    durationDays: 365,
    maxItems: 100,
    maxClients: 1,
    color: 'indigo',
    featuresText: ''
  }
}

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  errors.value = {}
  modalOpen.value = true
}

function openEdit(p) {
  editing.value = p
  form.value = {
    name: p.name,
    price: p.price,
    durationDays: p.durationDays,
    maxItems: p.maxItems,
    maxClients: p.maxClients,
    color: p.color,
    featuresText: (p.features || []).join('\n')
  }
  errors.value = {}
  modalOpen.value = true
}

function validate() {
  errors.value = {}
  if (!form.value.name?.trim()) errors.value.name = 'Requerido'
  if (form.value.price < 0) errors.value.price = 'No puede ser negativo'
  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return
  const features = form.value.featuresText
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)

  const payload = {
    name: form.value.name.trim(),
    price: Number(form.value.price) || 0,
    durationDays: Number(form.value.durationDays) || 365,
    maxItems: Number(form.value.maxItems) || 0,
    maxClients: Number(form.value.maxClients) || 1,
    color: form.value.color,
    features
  }

  if (editing.value) {
    plans.updatePlan(editing.value.id, payload)
    toast.success('Plan actualizado')
  } else {
    plans.addPlan(payload)
    toast.success('Plan creado')
  }
  modalOpen.value = false
}

async function removePlan(id) {
  const p = plans.getById(id)
  const ok = await confirm({
    title: 'Eliminar plan',
    message: `¿Eliminar "${p?.name}"? Los clientes con este plan no se verán afectados.`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (ok) {
    plans.removePlan(id)
    toast.success('Plan eliminado')
  }
}

function fmt(n) { return settings.format(n || 0) }

const colorOptions = [
  { id: 'sky', label: 'Azul' },
  { id: 'indigo', label: 'Índigo' },
  { id: 'violet', label: 'Violeta' },
  { id: 'fuchsia', label: 'Fucsia' },
  { id: 'emerald', label: 'Esmeralda' },
  { id: 'amber', label: 'Ámbar' }
]

const colorMap = {
  sky: 'from-sky-500 to-cyan-500',
  indigo: 'from-indigo-500 to-violet-500',
  violet: 'from-violet-500 to-purple-500',
  fuchsia: 'from-fuchsia-500 to-pink-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500'
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white p-6 lg:p-10">
    <div class="max-w-7xl mx-auto space-y-6">

      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold">Planes</h1>
          <p class="text-white/50 text-sm mt-1">Configura los planes que ofreces a tus clientes</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="openCreate" class="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-fuchsia-600 to-purple-500 shadow-lg shadow-fuchsia-500/30 hover:brightness-110 transition">
            + Nuevo plan
          </button>
          <RouterLink :to="{ name: 'sa-dashboard' }" class="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition">
            ← Volver
          </RouterLink>
        </div>
      </div>

      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div v-for="p in plans.plans" :key="p.id" class="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur relative overflow-hidden">
          <div :class="['absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r', colorMap[p.color] || colorMap.indigo]"></div>

          <div class="flex items-start justify-between gap-3 mb-3">
            <h3 class="text-xl font-bold">{{ p.name }}</h3>
            <span v-if="p.fixed" class="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">base</span>
          </div>

          <div class="mb-4">
            <span class="text-3xl font-bold">{{ fmt(p.price) }}</span>
            <span class="text-sm text-white/50 ml-1">/ {{ p.durationDays }} días</span>
          </div>

          <ul class="space-y-1.5 mb-5 text-sm">
            <li v-for="(f, i) in p.features" :key="i" class="flex items-start gap-2 text-white/70">
              <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              {{ f }}
            </li>
          </ul>

          <div class="pt-4 border-t border-white/10 flex items-center gap-2">
            <button @click="openEdit(p)" class="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition">
              Editar
            </button>
            <button
              v-if="!p.fixed"
              @click="removePlan(p.id)"
              class="px-3 py-2 rounded-lg text-sm font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="modalOpen" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="modalOpen = false" />
          <div class="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-white/10 shadow-2xl max-h-[92vh] flex flex-col text-white">
            <div class="flex items-center justify-between p-5 border-b border-white/10">
              <h2 class="text-lg font-semibold">{{ editing ? 'Editar plan' : 'Nuevo plan' }}</h2>
              <button @click="modalOpen = false" class="p-2 rounded-lg text-white/50 hover:bg-white/10">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form @submit.prevent="submit" class="p-5 space-y-4 overflow-y-auto">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-1.5">Nombre *</label>
                <input v-model="form.name" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" placeholder="Ej: Plan Empresarial" />
                <p v-if="errors.name" class="mt-1 text-xs text-rose-400">{{ errors.name }}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-1.5">Precio (Bs)</label>
                  <input v-model.number="form.price" type="number" min="0" step="1" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-1.5">Duración (días)</label>
                  <input v-model.number="form.durationDays" type="number" min="1" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-1.5">Máx. ítems</label>
                  <input v-model.number="form.maxItems" type="number" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" />
                  <p class="text-xs text-white/40 mt-1">-1 = ilimitado</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-1.5">Máx. usuarios</label>
                  <input v-model.number="form.maxClients" type="number" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" />
                  <p class="text-xs text-white/40 mt-1">-1 = ilimitado</p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-1.5">Color</label>
                <div class="flex gap-2 flex-wrap">
                  <button
                    v-for="c in colorOptions"
                    :key="c.id"
                    type="button"
                    @click="form.color = c.id"
                    :class="[
                      'w-9 h-9 rounded-xl bg-gradient-to-tr border-2 transition',
                      colorMap[c.id],
                      form.color === c.id ? 'border-white scale-110' : 'border-transparent'
                    ]"
                    :title="c.label"
                  ></button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-1.5">
                  Características <span class="text-white/40 font-normal">(una por línea)</span>
                </label>
                <textarea v-model="form.featuresText" rows="4"
                  class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition resize-none"
                  placeholder="Prendas ilimitadas&#10;3 usuarios&#10;Soporte prioritario"></textarea>
              </div>
            </form>

            <div class="p-5 border-t border-white/10 flex gap-3">
              <button type="button" @click="modalOpen = false" class="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">
                Cancelar
              </button>
              <button type="button" @click="submit" class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-fuchsia-600 to-purple-500 shadow-lg shadow-fuchsia-500/30 hover:brightness-110 transition">
                {{ editing ? 'Guardar' : 'Crear plan' }}
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