<script setup>
import { ref } from 'vue'
import { useItemsStore } from '@/stores/Items.js'
import { useMaterialsStore } from '@/stores/materials.js'
import { useMachinesStore } from '@/stores/machines.js'
import { useClientsStore } from '@/stores/clients.js'
import { useAuthStore } from '@/stores/auth.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { storage } from '@/utils/storage'

const items = useItemsStore()
const materials = useMaterialsStore()
const machines = useMachinesStore()
const clients = useClientsStore()
const auth = useAuthStore()
const settings = useSettingsStore()
const toast = useToast()
const { confirm } = useConfirm()

const name = ref(auth.user?.name || '')
const email = ref(auth.user?.email || '')

// Estado para el formulario de nueva moneda
const newCurrency = ref({ code: '', symbol: '', name: '', rate: 1 })
const showAddCurrency = ref(false)
const editingCurrency = ref(null)

function saveProfile() {
  auth.login(name.value, email.value)
  toast.success('Perfil actualizado')
}

function addCurrency() {
  const { code, symbol, name, rate } = newCurrency.value
  if (!code || !symbol || !name) {
    toast.error('Completa código, símbolo y nombre')
    return
  }
  if (settings.currencies.some(c => c.code === code.toUpperCase())) {
    toast.error('Esa moneda ya existe')
    return
  }
  settings.addCurrency({ code, symbol, name, rate })
  newCurrency.value = { code: '', symbol: '', name: '', rate: 1 }
  showAddCurrency.value = false
  toast.success('Moneda añadida')
}

function updateCurrencyField(id, field, value) {
  settings.updateCurrency(id, { [field]: field === 'rate' ? Number(value) : value })
}

async function removeCurrency(id) {
  const c = settings.currencies.find(x => x.id === id)
  const ok = await confirm({
    title: 'Eliminar moneda',
    message: `¿Eliminar "${c?.name}" del listado?`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (ok) {
    settings.removeCurrency(id)
    toast.success('Moneda eliminada')
  }
}

async function resetData() {
  const ok = await confirm({
    title: 'Borrar todos los datos',
    message:
      'Se eliminarán todas las prendas, materiales, máquinas y clientes registrados. Esta acción no se puede deshacer.',
    confirmText: 'Borrar todo',
    danger: true
  })
  if (ok) {
    items.reset()
    materials.reset()
    machines.reset()
    clients.reset()
    toast.success('Datos eliminados')
  }
}

async function factoryReset() {
  const ok = await confirm({
    title: 'Restablecer la aplicación',
    message: 'Se borrarán todos los datos y tu sesión. ¿Continuar?',
    confirmText: 'Restablecer',
    danger: true
  })
  if (ok) {
    storage.clearAll()
    location.reload()
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-5">
    <!-- Perfil -->
    <section class="card p-6">
      <h2 class="font-semibold text-slate-900">Perfil</h2>
      <p class="text-sm text-slate-500 mb-5">Información visible en el panel.</p>

      <div class="flex items-center gap-4 mb-5">
        <div class="w-16 h-16 rounded-2xl bg-linear-to-tr from-indigo-500 to-violet-500 grid place-items-center text-white text-2xl font-bold">
          {{ (name || 'U')[0].toUpperCase() }}
        </div>
        <div>
          <p class="font-medium text-slate-900">{{ name || 'Sin nombre' }}</p>
          <p class="text-sm text-slate-500">{{ email || 'Sin email' }}</p>
        </div>
      </div>

      <form @submit.prevent="saveProfile" class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="label">Nombre</label>
          <input v-model="name" class="input" />
        </div>
        <div>
          <label class="label">Email</label>
          <input v-model="email" type="email" class="input" />
        </div>
        <div class="sm:col-span-2 flex justify-end">
          <button class="btn-primary">Guardar</button>
        </div>
      </form>
    </section>

    <!-- ==================== MONEDAS ==================== -->
    <section class="card p-6">
      <div class="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 class="font-semibold text-slate-900">Monedas</h2>
          <p class="text-sm text-slate-500">Configura las divisas disponibles en el sistema.</p>
        </div>
        <button
          @click="showAddCurrency = !showAddCurrency"
          class="btn-ghost text-sm border border-slate-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Añadir
        </button>
      </div>

      <!-- Formulario nueva moneda -->
      <div v-if="showAddCurrency" class="mb-5 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
        <p class="text-sm font-medium text-indigo-900 mb-3">Nueva moneda</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label class="label text-xs">Código</label>
            <input v-model="newCurrency.code" placeholder="EUR" maxlength="5" class="input text-sm uppercase" />
          </div>
          <div>
            <label class="label text-xs">Símbolo</label>
            <input v-model="newCurrency.symbol" placeholder="€" maxlength="3" class="input text-sm" />
          </div>
          <div class="col-span-2">
            <label class="label text-xs">Nombre</label>
            <input v-model="newCurrency.name" placeholder="Euro" class="input text-sm" />
          </div>
          <div class="col-span-2">
            <label class="label text-xs">Tasa (1 BOB = ?)</label>
            <input v-model.number="newCurrency.rate" type="number" step="0.0001" min="0.0001" class="input text-sm" />
          </div>
          <div class="col-span-2 flex items-end gap-2">
            <button @click="showAddCurrency = false" class="btn-ghost flex-1 text-sm border border-slate-200">
              Cancelar
            </button>
            <button @click="addCurrency" class="btn-primary flex-1 text-sm">
              Guardar
            </button>
          </div>
        </div>
      </div>

      <!-- Lista de monedas -->
      <ul class="divide-y divide-slate-100">
        <li v-for="c in settings.currencies" :key="c.id" class="py-3 flex items-center gap-3 flex-wrap">
          <!-- Activar como moneda principal -->
          <button
            @click="settings.setActive(c.id)"
            :class="[
              'w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 transition',
              settings.activeCurrency === c.id
                ? 'border-indigo-500 bg-indigo-500'
                : 'border-slate-300 hover:border-indigo-300'
            ]"
            :title="settings.activeCurrency === c.id ? 'Moneda activa' : 'Activar'"
          >
            <span v-if="settings.activeCurrency === c.id" class="w-2 h-2 rounded-full bg-white"></span>
          </button>

          <!-- Info de la moneda -->
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="text-lg font-bold text-slate-700 shrink-0">{{ c.symbol }}</span>
            <div class="min-w-0">
              <p class="font-medium text-slate-900 truncate">
                {{ c.name }}
                <span v-if="c.fixed" class="text-xs text-slate-400 font-normal ml-1">· base</span>
              </p>
              <p class="text-xs text-slate-500">{{ c.code }}</p>
            </div>
          </div>

          <!-- Tasa editable (excepto BOB base) -->
          <div v-if="!c.fixed" class="flex items-center gap-1 text-xs">
            <span class="text-slate-400">1 BOB =</span>
            <input
              :value="c.rate"
              @change="updateCurrencyField(c.id, 'rate', $event.target.value)"
              type="number"
              step="0.0001"
              min="0.0001"
              class="w-24 px-2 py-1 rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm"
            />
            <span class="text-slate-500">{{ c.code }}</span>
          </div>
          <span v-else class="text-xs text-slate-400 italic">Moneda base</span>

          <!-- Eliminar (solo personalizadas) -->
          <button
            v-if="!c.fixed"
            @click="removeCurrency(c.id)"
            class="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Eliminar moneda"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"/>
            </svg>
          </button>
        </li>
      </ul>

      <p class="text-xs text-slate-400 mt-4">
        💡 Los precios se almacenan en <strong>Bolivianos (BOB)</strong>. Al cambiar la moneda activa, se convierten automáticamente.
      </p>
    </section>

    <!-- Resumen de datos -->
    <section class="card p-6">
      <h2 class="font-semibold text-slate-900">Datos</h2>
      <p class="text-sm text-slate-500 mb-5">
        La información se guarda en el almacenamiento local del navegador.
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div class="rounded-xl bg-slate-50 p-4 text-center">
          <p class="text-2xl font-bold text-slate-900">{{ items.stats.total }}</p>
          <p class="text-xs text-slate-500 mt-1">Prendas</p>
        </div>
        <div class="rounded-xl bg-slate-50 p-4 text-center">
          <p class="text-2xl font-bold text-slate-900">{{ materials.stats.total }}</p>
          <p class="text-xs text-slate-500 mt-1">Materiales</p>
        </div>
        <div class="rounded-xl bg-slate-50 p-4 text-center">
          <p class="text-2xl font-bold text-slate-900">{{ machines.stats.total }}</p>
          <p class="text-xs text-slate-500 mt-1">Máquinas</p>
        </div>
        <div class="rounded-xl bg-slate-50 p-4 text-center">
          <p class="text-2xl font-bold text-slate-900">{{ clients.stats.total }}</p>
          <p class="text-xs text-slate-500 mt-1">Clientes</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <button @click="resetData" class="btn-ghost border border-rose-200 text-rose-600 hover:bg-rose-50">
          Borrar todos los datos
        </button>
        <button @click="factoryReset" class="btn-danger">
          Restablecer aplicación
        </button>
      </div>
    </section>

    <section class="card p-6">
      <h2 class="font-semibold text-slate-900 mb-3">Acerca de</h2>
      <p class="text-sm text-slate-600">
        <strong>LaundryPro</strong> · Sistema de gestión de limpieza para trajes, camas, ropa,
        materiales, máquinas y clientes.
      </p>
      <p class="text-xs text-slate-400 mt-3">
        Vue 3 · Vite · TailwindCSS v4 · Pinia · localStorage — v1.1.0
      </p>
    </section>
  </div>
</template>