import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'

export const useClientsStore = defineStore('clients', () => {
  const clients = ref(storage.get('clients', []))

  watch(clients, (v) => storage.set('clients', v), { deep: true })

  const stats = computed(() => ({
    total: clients.value.length,
    vip: clients.value.filter(c => c.tier === 'vip').length,
    recurrentes: clients.value.filter(c => c.tier === 'recurrente').length,
    nuevos: clients.value.filter(c => c.tier === 'nuevo').length
  }))

  function addClient(data) {
    const item = {
      id: uid(),
      code: `CLI-${String(clients.value.length + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orders: 0,
      totalSpent: 0,
      ...data
    }
    clients.value.unshift(item)
    return item
  }

  function updateClient(id, data) {
    const idx = clients.value.findIndex(c => c.id === id)
    if (idx === -1) return
    clients.value[idx] = { ...clients.value[idx], ...data, updatedAt: new Date().toISOString() }
  }

  function removeClient(id) {
    clients.value = clients.value.filter(c => c.id !== id)
  }

  function getById(id) { return clients.value.find(c => c.id === id) }
  function reset() { clients.value = [] }

  return { clients, stats, addClient, updateClient, removeClient, getById, reset }
})