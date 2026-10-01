import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'

export const CATEGORIES = [
  { id: 'traje', label: 'Traje', icon: '🤵', color: 'indigo' },
  { id: 'cama', label: 'Cama', icon: '🛏️', color: 'violet' },
  { id: 'ropa', label: 'Ropa', icon: '👕', color: 'sky' },
  { id: 'toalla', label: 'Toalla', icon: '🧺', color: 'emerald' },
  { id: 'cortina', label: 'Cortina', icon: '🪟', color: 'amber' },
  { id: 'otro', label: 'Otro', icon: '📦', color: 'slate' }
]

export const STATUSES = [
  { id: 'pendiente', label: 'Pendiente', color: 'amber' },
  { id: 'lavando', label: 'Lavando', color: 'sky' },
  { id: 'secando', label: 'Secando', color: 'violet' },
  { id: 'planchando', label: 'Planchando', color: 'rose' },
  { id: 'listo', label: 'Listo', color: 'emerald' },
  { id: 'entregado', label: 'Entregado', color: 'slate' }
]

export const useItemsStore = defineStore('items', () => {
  const items = ref(storage.get('items', []))

  watch(items, (val) => storage.set('items', val), { deep: true })

  const stats = computed(() => {
    const by = (s) => items.value.filter(i => i.status === s).length
    return {
      total: items.value.length,
      pendiente: by('pendiente'),
      enProceso: items.value.filter(i => ['lavando','secando','planchando'].includes(i.status)).length,
      listo: by('listo'),
      entregado: by('entregado'),
      ingresos: items.value.reduce((s, i) => s + (Number(i.price) || 0), 0)
    }
  })

  const byCategory = computed(() => {
    const map = {}
    for (const c of CATEGORIES) map[c.id] = 0
    items.value.forEach(i => { map[i.category] = (map[i.category] || 0) + 1 })
    return map
  })

  function addItem(data) {
    const item = {
      id: uid(),
      code: `LP-${String(items.value.length + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{ at: new Date().toISOString(), status: data.status || 'pendiente', note: 'Creación' }],
      ...data
    }
    items.value.unshift(item)
    return item
  }

  function updateItem(id, data) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) return
    const prev = items.value[idx]
    const updated = { ...prev, ...data, updatedAt: new Date().toISOString() }
    if (data.status && data.status !== prev.status) {
      updated.history = [...(prev.history || []), { at: updated.updatedAt, status: data.status, note: 'Cambio de estado' }]
    }
    items.value[idx] = updated
  }

  function removeItem(id) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function advanceStatus(id) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    const order = STATUSES.map(s => s.id)
    const idx = order.indexOf(item.status)
    const next = order[Math.min(idx + 1, order.length - 1)]
    if (next !== item.status) updateItem(id, { status: next })
  }

  function getById(id) {
    return items.value.find(i => i.id === id)
  }

  function reset() { items.value = [] }

  return { items, stats, byCategory, addItem, updateItem, removeItem, advanceStatus, getById, reset }
})