import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/items', name: 'items', component: () => import('@/views/ItemsView.vue') },
  { path: '/items/:id', name: 'item-detail', component: () => import('@/views/ItemDetailView.vue'), props: true },
  { path: '/materials', name: 'materials', component: () => import('@/views/MaterialsView.vue') },
  { path: '/machines', name: 'machines', component: () => import('@/views/MachinesView.vue') },
  { path: '/clients', name: 'clients', component: () => import('@/views/ClientsView.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: { name: 'dashboard' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' }
})

export default router