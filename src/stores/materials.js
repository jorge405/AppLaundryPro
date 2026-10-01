import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'

export const MATERIAL_CATEGORIES = [
  { id: 'detergente', label: 'Detergente', icon: '🧴', color: 'sky' },
  { id: 'suavizante', label: 'Suavizante', icon: '💧', color: 'violet' },
  { id: 'quitamanchas', label: 'Quitamanchas', icon: '✨', color: 'amber' },
  { id: 'desinfectante', label: 'Desinfectante', icon: '🧪', color: 'emerald' },
  { id: 'blanqueador', label: 'Blanqueador', icon: '⚪', color: 'rose' },
  { id: 'perfume', label: 'Perfume', icon: '🌸', color: 'pink' },
  { id: 'otros', label: 'Otros', icon: '📦', color: 'slate' }
]

export const useMaterialsStore = defineStore('materials', () => {
  const materials = ref(storage.get('materials', []))

  watch(materials, (v) => storage.set('materials', v), { deep: true })

  const stats = computed(() => {
    const lowStock = materials.value.filter(m => m.stock <= (m.minStock || 0))
    return {
      total: materials.value.length,
      lowStock: lowStock.length,
      totalValue: materials.value.reduce((s, m) => s + (Number(m.price) || 0) * (Number(m.stock) || 0), 0),
      categories: new Set(materials.value.map(m => m.category)).size
    }
  })

  const lowStockItems = computed(() =>
    materials.value.filter(m => m.stock <= (m.minStock || 0))
  )

  function addMaterial(data) {
    const item = {
      id: uid(),
      code: `MAT-${String(materials.value.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    }
    materials.value.unshift(item)
    return item
  }

  function updateMaterial(id, data) {
    const idx = materials.value.findIndex(m => m.id === id)
    if (idx === -1) return
    materials.value[idx] = { ...materials.value[idx], ...data, updatedAt: new Date().toISOString() }
  }

  function removeMaterial(id) {
    materials.value = materials.value.filter(m => m.id !== id)
  }

  function adjustStock(id, delta) {
    const m = materials.value.find(x => x.id === id)
    if (!m) return
    m.stock = Math.max(0, (Number(m.stock) || 0) + delta)
    m.updatedAt = new Date().toISOString()
  }

  function getById(id) { return materials.value.find(m => m.id === id) }
  function reset() { materials.value = [] }

  return { materials, stats, lowStockItems, addMaterial, updateMaterial, removeMaterial, adjustStock, getById, reset }
})