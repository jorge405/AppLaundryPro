<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, ROLES } from '@/stores/auth.js'
import { useSuperAdminStore } from '@/stores/superadmin.js'
import { useEmployeesStore } from '@/stores/employees.js'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const auth = useAuthStore()
const sa = useSuperAdminStore()
const employees = useEmployeesStore()
const toast = useToast()

const email = ref('')
const password = ref('')

/** Cuentas de demostración visibles en el login */
const DEMO_EMPLOYEE = {
  name: 'Empleado Demo',
  email: 'empleado@laundrypro.app',
  password: 'empleado123'
}

const DEMO_ADMIN = {
  name: 'Administrador del Negocio',
  email: 'administrador@laundrypro.app',
  password: 'admin1234'
}

function submit() {
  if (!email.value.trim() || !password.value) {
    toast.error('Introduce email y contraseña')
    return
  }

  const mail = email.value.trim().toLowerCase()

  // 1) Administrador del negocio (empresa cliente del superadmin)
  const company = sa.clients.find(
    c => (c.email || '').toLowerCase() === mail && c.password === password.value
  )
  if (company) {
    auth.login(company.name, company.email, {
      role: ROLES.ADMIN,
      companyId: company.id,
      companyName: company.name
    })
    toast.success(`¡Bienvenido, ${company.name}!`)
    router.push({ name: 'admin-panel' })
    return
  }

  // 2) Administrador del negocio (cuenta demo)
  if (mail === DEMO_ADMIN.email && password.value === DEMO_ADMIN.password) {
    auth.login(DEMO_ADMIN.name, DEMO_ADMIN.email, { role: ROLES.ADMIN })
    toast.success(`¡Bienvenido, ${DEMO_ADMIN.name}!`)
    router.push({ name: 'admin-panel' })
    return
  }

  // 3) Empleado registrado por el administrador
  const employee = employees.authenticate(mail, password.value)
  if (employee) {
    auth.login(employee.name, employee.email, {
      role: employee.role || ROLES.EMPLOYEE,
      branchId: employee.branchId || '',
      branchName: employee.branchName || ''
    })
    toast.success(`¡Bienvenido, ${employee.name}!`)
    router.push({ name: 'dashboard' })
    return
  }

  // 4) Empleado demo
  if (mail === DEMO_EMPLOYEE.email && password.value === DEMO_EMPLOYEE.password) {
    auth.login(DEMO_EMPLOYEE.name, DEMO_EMPLOYEE.email, { role: ROLES.EMPLOYEE })
    toast.success(`¡Bienvenido, ${DEMO_EMPLOYEE.name}!`)
    router.push({ name: 'dashboard' })
    return
  }

  toast.error('Credenciales incorrectas. Revisa las cuentas de demostración.')
}

function fill(account) {
  email.value = account.email
  password.value = account.password
  toast.info('Credenciales cargadas. Pulsa Entrar.')
}

const fillEmployee = () => fill(DEMO_EMPLOYEE)
const fillAdmin = () => fill(DEMO_ADMIN)
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
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a6 6 0 00-1.806.547M8 4h8l-1 1v5.172a6 6 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A6 6 0 009 10.172V5L8 4z"/>
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

        <!-- Cuentas de demostración -->
        <div class="mb-5 space-y-3">
          <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 grid place-items-center shrink-0">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div class="text-xs flex-1">
                <p class="font-semibold text-emerald-900">Empleado</p>
                <p class="text-emerald-700 mt-0.5">
                  <span class="font-mono">empleado@laundrypro.app</span> ·
                  <span class="font-mono">empleado123</span>
                </p>
                <p class="text-emerald-600 mt-1">Crea prendas, materiales, máquinas y gestiona clientes.</p>
              </div>
              <button type="button" @click="fillEmployee" class="btn-ghost text-[11px] px-2 py-1 shrink-0 border border-emerald-200 text-emerald-700">
                Usar
              </button>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-violet-50 border border-violet-100">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-violet-100 grid place-items-center shrink-0">
                <svg class="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <div class="text-xs flex-1">
                <p class="font-semibold text-violet-900">Administrador del negocio</p>
                <p class="text-violet-700 mt-0.5">
                  <span class="font-mono">administrador@laundrypro.app</span> ·
                  <span class="font-mono">admin1234</span>
                </p>
                <p class="text-violet-600 mt-1">Ve y crea sucursales, reportes y gestión de empleados.</p>
              </div>
              <button type="button" @click="fillAdmin" class="btn-ghost text-[11px] px-2 py-1 shrink-0 border border-violet-200 text-violet-700">
                Usar
              </button>
            </div>
          </div>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              autocomplete="username"
              placeholder="empleado@laundrypro.app"
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
        </form>

        <p class="mt-6 text-xs text-center text-slate-400">
          Los datos se guardan localmente en tu navegador.
        </p>
      </div>

      <!-- Footer debajo de card -->
      <p class="text-center text-xs text-white/60 mt-6">
        © {{ new Date().getFullYear() }} LaundryPro · DigitalDevTech Derechos reservados · <a href="https://laundrypro.app" target="_blank" class="underline hover:text-white">laundrypro.app</a>
      </p>
    </div>
  </div>
</template>
