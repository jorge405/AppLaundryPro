import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'

// Credenciales del superadmin (quemadas)
export const SUPERADMIN_CREDENTIALS = {
  email: 'admin@laundrypro.app',
  password: 'admin2025'
}

export const useSuperAdminStore = defineStore('superadmin', () => {
  const isLoggedIn = ref(storage.get('superadmin:loggedIn', false))
  const clients = ref(storage.get('superadmin:clients', []))

  watch(isLoggedIn, (v) => storage.set('superadmin:loggedIn', v))
  watch(clients, (v) => storage.set('superadmin:clients', v), { deep: true })

  const stats = computed(() => {
    const now = Date.now()
    const active = clients.value.filter(c => !isExpired(c))
    const expired = clients.value.filter(c => isExpired(c))
    return {
      total: clients.value.length,
      active: active.length,
      expired: expired.length,
      revenue: clients.value.reduce((s, c) => s + (Number(c.planPrice) || 0), 0)
    }
  })

  function isExpired(client) {
    if (!client?.expiresAt) return false
    return new Date(client.expiresAt).getTime() < Date.now()
  }

  function daysLeft(client) {
    if (!client?.expiresAt) return 0
    const diff = new Date(client.expiresAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  function login(email, password) {
    if (email === SUPERADMIN_CREDENTIALS.email && password === SUPERADMIN_CREDENTIALS.password) {
      isLoggedIn.value = true
      return true
    }
    return false
  }

  function logout() {
    isLoggedIn.value = false
  }

  function addClient({ name, email, password, planId, planName, planPrice, durationDays = 365, notes = '' }) {
    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + durationDays)

    const client = {
      id: uid(),
      name,
      email,
      password,           // 🔒 solo demo, en producción hashear
      planId,
      planName,
      planPrice: Number(planPrice) || 0,
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      durationDays,
      notes,
      active: true,
      createdAt: now.toISOString()
    }
    clients.value.unshift(client)
    return client
  }

  function updateClient(id, data) {
    const idx = clients.value.findIndex(c => c.id === id)
    if (idx === -1) return
    const prev = clients.value[idx]
    const updated = { ...prev, ...data }

    // Recalcular expiración si cambian los días de duración
    if (data.durationDays && data.durationDays !== prev.durationDays) {
      const exp = new Date(prev.startedAt)
      exp.setDate(exp.getDate() + Number(data.durationDays))
      updated.expiresAt = exp.toISOString()
    }
    clients.value[idx] = updated
  }

  function removeClient(id) {
    clients.value = clients.value.filter(c => c.id !== id)
  }

  /**
   * Renueva un cliente por otro año (365 días)
   */
  function renewYear(id) {
    const c = clients.value.find(x => x.id === id)
    if (!c) return
    const base = isExpired(c) ? new Date() : new Date(c.expiresAt)
    base.setDate(base.getDate() + 365)
    c.expiresAt = base.toISOString()
    c.startedAt = new Date().toISOString()
    c.durationDays = 365
  }

  function getById(id) { return clients.value.find(c => c.id === id) }
  function reset() { clients.value = [] }

  return {
    isLoggedIn, clients, stats,
    login, logout,
    addClient, updateClient, removeClient, renewYear, getById, reset,
    isExpired, daysLeft
  }
})