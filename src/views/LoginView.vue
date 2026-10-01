<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')

const DEMO = {
  name: 'Usuario Demo',
  email: 'demo@laundrypro.app',
  password: 'demo1234'
}

function submit() {
  if (!email.value.trim() || !password.value) {
    toast.error('Introduce email y contraseña')
    return
  }
  const ok =
    email.value.trim().toLowerCase() === DEMO.email &&
    password.value === DEMO.password

  if (!ok) {
    toast.error('Credenciales incorrectas. Usa el botón Demo.')
    return
  }
  auth.login(DEMO.name, DEMO.email)
  toast.success(`¡Bienvenido, ${DEMO.name}!`)
  router.push({ name: 'dashboard' })
}

function loginDemo() {
  email.value = DEMO.email
  password.value = DEMO.password
  toast.info('Credenciales demo cargadas. Pulsa Entrar.')
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10
              bg-linear-to-br from-slate-900 via-sky-800 to-cyan-400">

    <!-- Blobs decorativos celestes -->
    <div class="absolute -top-40 -left-40 w-125 h-125 bg-cyan-300/30 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-40 -right-40 w-125 h-125 bg-sky-500/30 rounded-full blur-3xl"></div>
    <div class="absolute top-1/3 left-1/2 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

    <!-- Grid pattern sutil -->
    <div
      class="absolute inset-0 opacity-[0.06] pointer-events-none"
      style="background-image: linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px); background-size: 44px 44px;"
    ></div>

    <!-- Card centrada -->
    <div class="relative w-full max-w-md">

      <!-- Logo flotante arriba de la card -->
      <div class="flex flex-col items-center mb-6">
        <div class="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 grid place-items-center shadow-2xl shadow-sky-900/40">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
          </svg>
        </div>
        <h1 class="mt-4 text-2xl font-bold text-white tracking-tight">LaundryPro</h1>
        <p class="text-sm text-white/70 mt-1">Gestión de limpieza profesional</p>
      </div>

      <!-- Formulario glass -->
      <div class="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-900/30 border border-white/60 p-8">

        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-slate-900">Inicia sesión</h2>
          <p class="text-sm text-slate-500 mt-1">Accede a tu panel de limpieza</p>
        </div>

        <!-- Alerta demo -->
        <div class="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-sky-50 border border-sky-100">
          <div class="w-8 h-8 rounded-lg bg-sky-100 grid place-items-center shrink-0">
            <svg class="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="text-xs">
            <p class="font-semibold text-sky-900">Cuenta demo</p>
            <p class="text-sky-700 mt-0.5">
              <span class="font-mono">demo@laundrypro.app</span> ·
              <span class="font-mono">demo1234</span>
            </p>
          </div>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              autocomplete="username"
              placeholder="demo@laundrypro.app"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900
                     placeholder-slate-400 outline-none transition
                     focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900
                     placeholder-slate-400 outline-none transition
                     focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
            />
          </div>

          <button
            type="submit"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white
                   bg-linear-to-r from-sky-600 to-cyan-500
                   shadow-lg shadow-sky-600/30 hover:shadow-sky-600/50 hover:brightness-110
                   active:scale-[.98] transition-all"
          >
            Entrar al panel
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>

          <div class="relative py-1">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200"></div>
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="px-3 bg-white text-slate-400">o</span>
            </div>
          </div>

          <button
            type="button"
            @click="loginDemo"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium
                   bg-slate-100 text-slate-700 border border-slate-200
                   hover:bg-slate-200 active:scale-[.98] transition-all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Rellenar credenciales demo
          </button>
        </form>

        <p class="mt-6 text-xs text-center text-slate-400">
          Los datos se guardan localmente en tu navegador.
        </p>
      </div>

      <!-- Footer debajo de card -->
      <p class="text-center text-xs text-white/60 mt-6">
        © {{ new Date().getFullYear() }} LaundryPro · Vue 3 + TailwindCSS v4
      </p>
    </div>
  </div>
</template>