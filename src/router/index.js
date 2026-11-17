import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore, ROLES } from '@/stores/auth'
import { useSuperAdminStore } from '@/stores/superadmin'

const ALL = [ROLES.EMPLOYEE, ROLES.ADMIN]
const ONLY_EMPLOYEE = [ROLES.EMPLOYEE]
const ONLY_ADMIN = [ROLES.ADMIN]

const routes = [
  // ===== LOGIN =====
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },

  // ===== OPERATIVO (lectura para ambos, escritura solo empleados) =====
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { roles: ONLY_EMPLOYEE } },
  { path: '/items', name: 'items', component: () => import('@/views/ItemsView.vue'), meta: { roles: ALL } },
  { path: '/items/:id', name: 'item-detail', component: () => import('@/views/ItemDetailView.vue'), meta: { roles: ALL } },
  { path: '/materials', name: 'materials', component: () => import('@/views/MaterialsView.vue'), meta: { roles: ALL } },
  { path: '/machines', name: 'machines', component: () => import('@/views/MachinesView.vue'), meta: { roles: ALL } },
  { path: '/ganancias', name: 'earnings', component: () => import('@/views/EarningsView.vue'), meta: { roles: ALL } },

  // ===== ADMINISTRADOR DEL NEGOCIO =====
  { path: '/admin-panel', name: 'admin-panel', component: () => import('@/views/AdminDashboardView.vue'), meta: { roles: ONLY_ADMIN } },
  { path: '/sucursales', name: 'branches', component: () => import('@/views/BranchesView.vue'), meta: { roles: ONLY_ADMIN } },
  { path: '/empleados', name: 'employees', component: () => import('@/views/EmployeesView.vue'), meta: { roles: ONLY_ADMIN } },
  { path: '/reportes', name: 'reports', component: () => import('@/views/ReportsView.vue'), meta: { roles: ONLY_ADMIN } },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { roles: ONLY_ADMIN } },

  // ===== SOLO EMPLEADOS =====
  { path: '/clients', name: 'clients', component: () => import('@/views/ClientsView.vue'), meta: { roles: ONLY_EMPLOYEE } },

  // ===== SUPERADMIN =====
  { path: '/superadmin/login', name: 'sa-login', component: () => import('@/views/superadmin/LoginView.vue'), meta: { public: true, sa: true } },
  { path: '/superadmin', name: 'sa-dashboard', component: () => import('@/views/superadmin/DashboardView.vue'), meta: { sa: true } },
  { path: '/superadmin/clients', name: 'sa-clients', component: () => import('@/views/superadmin/ClientsView.vue'), meta: { sa: true } },
  { path: '/superadmin/plans', name: 'sa-plans', component: () => import('@/views/superadmin/PlansView.vue'), meta: { sa: true } },

  { path: '/:pathMatch(.*)*', redirect: { name: 'dashboard' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

/** Ruta de inicio según el rol */
function homeFor(auth) {
  return auth.isAdmin ? 'admin-panel' : 'dashboard'
}

router.beforeEach((to) => {
  const auth = useAuthStore()
  const sa = useSuperAdminStore()

  // Rutas de superadmin (gestión de empresas)
  if (to.meta.sa) {
    if (to.name === 'sa-login') {
      return sa.isLoggedIn ? { name: 'sa-dashboard' } : true
    }
    if (!sa.isLoggedIn) return { name: 'sa-login' }
    return true
  }

  // Rutas normales
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.name === 'login' && auth.isAuthenticated) return { name: homeFor(auth) }

  // Control de acceso por rol
  if (to.meta.roles && auth.isAuthenticated) {
    if (!to.meta.roles.includes(auth.role)) {
      return { name: homeFor(auth) }
    }
  }
})

export default router
