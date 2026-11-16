import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSuperAdminStore } from '@/stores/superadmin'

const routes = [
  // ===== USUARIO NORMAL =====
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/items', name: 'items', component: () => import('@/views/ItemsView.vue') },
  { path: '/items/:id', name: 'item-detail', component: () => import('@/views/ItemDetailView.vue') },
  { path: '/materials', name: 'materials', component: () => import('@/views/MaterialsView.vue') },
  { path: '/sucursales', name: 'branches', component: () => import('@/views/BranchesView.vue') },
  { path: '/machines', name: 'machines', component: () => import('@/views/MachinesView.vue') },
  { path: '/clients', name: 'clients', component: () => import('@/views/ClientsView.vue') },
  { path: '/earnings', name: 'earnings', component: () => import('@/views/EarningsView.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },

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

router.beforeEach((to) => {
  const auth = useAuthStore()
  const sa = useSuperAdminStore()

  // Rutas de superadmin
  if (to.meta.sa) {
    if (to.name === 'sa-login') {
      return sa.isLoggedIn ? { name: 'sa-dashboard' } : true
    }
    if (!sa.isLoggedIn) return { name: 'sa-login' }
    return true
  }

  // Rutas normales
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' }
})

export default router