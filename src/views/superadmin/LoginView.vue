<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSuperAdminStore, SUPERADMIN_CREDENTIALS } from '@/stores/superadmin'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const sa = useSuperAdminStore()
const toast = useToast()

const email = ref('')
const password = ref('')

function submit() {
  if (!sa.login(email.value.trim(), password.value)) {
    toast.error('Credenciales de superadmin incorrectas')
    return
  }
  toast.success('Bienvenido SuperAdmin')
  router.push({ name: 'sa-dashboard' })
}

function fillDemo() {
  email.value = SUPERADMIN_CREDENTIALS.email
  password.value = SUPERADMIN_CREDENTIALS.password
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-10
              bg-gradient-to-br from-slate-950 via-purple-950 to-fuchsia-950 relative overflow-hidden">
    <div class="absolute -top-40 -left-40 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl"></div>

    <div class="relative w-full max-w-md">
      <div class="flex flex-col items-center mb-6">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-purple-500 grid place-items-center text-white shadow-2xl shadow-fuchsia-500/40">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <h1 class="mt-4 text-2xl font-bold text-white">SuperAdmin</h1>
        <p class="text-sm text-white/60 mt-1">Panel de administración SaaS</p>
      </div>

      <div class="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
        <div class="mb-5 p-3.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/20">
          <p class="text-xs font-semibold text-fuchsia-300">Acceso demo</p>
          <p class="text-xs text-fuchsia-200/80 mt-1 font-mono">
            {{ SUPERADMIN_CREDENTIALS.email }} · {{ SUPERADMIN_CREDENTIALS.password }}
          </p>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-1.5">Email</label>
            <input v-model="email" type="email" placeholder="admin@laundrypro.app"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30
                     outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" />
          </div>
          <div>
            <label class="block text-sm font-medium text-white/80 mb-1.5">Contraseña</label>
            <input v-model="password" type="password" placeholder="••••••••"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30
                     outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/20 transition" />
          </div>
          <button class="w-full px-4 py-3 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-fuchsia-600 to-purple-500
                         shadow-lg shadow-fuchsia-500/30 hover:brightness-110 active:scale-[.98] transition">
            Entrar al panel
          </button>
          <button type="button" @click="fillDemo"
            class="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 bg-white/5 border border-white/10
                   hover:bg-white/10 transition">
            Rellenar credenciales demo
          </button>
        </form>
      </div>
    </div>
  </div>
</template>