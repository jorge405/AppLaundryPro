import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(storage.get('user'))

  const isAuthenticated = computed(() => !!user.value)
  /** 'owner' = dueño del negocio · 'manager' = encargado de una empresa */
  const role = computed(() => user.value?.role || 'owner')
  const isManager = computed(() => role.value === 'manager')
  const companyId = computed(() => user.value?.companyId || '')
  const companyName = computed(() => user.value?.companyName || '')

  function login(name, email, extra = {}) {
    user.value = {
      name: name || 'Usuario Demo',
      email: email || 'demo@laundrypro.app',
      role: 'owner',
      loginAt: new Date().toISOString(),
      ...extra
    }
    storage.set('user', user.value)
  }

  function logout() {
    user.value = null
    storage.remove('user')
  }

  return {
    user, isAuthenticated, role, isManager, companyId, companyName,
    login, logout
  }
})
