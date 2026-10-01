import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(storage.get('user'))

  const isAuthenticated = computed(() => !!user.value)

  function login(name, email) {
    user.value = {
      name: name || 'Usuario Demo',
      email: email || 'demo@laundrypro.app',
      loginAt: new Date().toISOString()
    }
    storage.set('user', user.value)
  }

  function logout() {
    user.value = null
    storage.remove('user')
  }

  return { user, isAuthenticated, login, logout }
})