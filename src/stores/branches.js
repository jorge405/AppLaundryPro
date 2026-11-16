import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'

/**
 * Sucursales del negocio.
 * Cada sucursal pertenece a una empresa (cliente del superadmin) y guarda
 * dirección, horario de ingreso/salida y el responsable a cargo.
 */
export const useBranchesStore = defineStore('branches', () => {
  const branches = ref(storage.get('branches', []))

  watch(branches, (v) => storage.set('branches', v), { deep: true })

  const list = computed(() =>
    [...branches.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  )

  const active = computed(() => list.value.filter(b => b.active !== false))

  const stats = computed(() => ({
    total: branches.value.length,
    active: active.value.length,
    companies: new Set(branches.value.map(b => b.companyId).filter(Boolean)).size
  }))

  function addBranch(data) {
    const branch = {
      id: uid(),
      name: (data.name || '').trim(),
      companyId: data.companyId || '',
      companyName: data.companyName || '',
      address: (data.address || '').trim(),
      phone: (data.phone || '').trim(),
      openTime: data.openTime || '08:00',
      closeTime: data.closeTime || '18:00',
      manager: (data.manager || '').trim(),
      notes: (data.notes || '').trim(),
      active: data.active !== false,
      createdAt: new Date().toISOString()
    }
    branches.value.unshift(branch)
    return branch
  }

  function updateBranch(id, data) {
    const idx = branches.value.findIndex(b => b.id === id)
    if (idx === -1) return
    branches.value[idx] = { ...branches.value[idx], ...data }
  }

  function removeBranch(id) {
    branches.value = branches.value.filter(b => b.id !== id)
  }

  function getById(id) { return branches.value.find(b => b.id === id) }

  function byCompany(companyId) {
    return list.value.filter(b => b.companyId === companyId)
  }

  function reset() { branches.value = [] }

  return { branches, list, active, stats, addBranch, updateBranch, removeBranch, getById, byCompany, reset }
})
