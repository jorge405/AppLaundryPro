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

  // Migración: materiales antiguos con `purchases` → `movements`
  for (const m of materials.value) {
    if (!m.movements) {
      m.movements = (m.purchases || []).map(p => ({ ...p, type: 'entrada' }))
    }
  }

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

  /** Proveedores usados en los materiales (además de los registrados) */
  const usedSuppliers = computed(() => {
    const set = new Set()
    for (const m of materials.value) {
      if (m.supplier) set.add(m.supplier)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  })

  function addMaterial(data) {
    const item = {
      id: uid(),
      code: `MAT-${String(materials.value.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      movements: [],
      ...data
    }
    // compatibilidad con materiales antiguos
    if (!item.movements && item.purchases) {
      item.movements = item.purchases.map(p => ({ ...p, type: 'entrada' }))
    }
    materials.value.unshift(item)
    return item
  }

  /**
   * Registra una compra (entrada de stock) y suma al stock del material.
   * purchase: { date, supplier, quantity, unitPrice }
   */
  function addStock(id, purchase = {}) {
    const m = materials.value.find(x => x.id === id)
    if (!m) return { blocked: true, reason: 'not-found' }

    const quantity = Number(purchase.quantity) || 0
    if (quantity <= 0) return { blocked: true, reason: 'invalid-quantity' }
    const unitPrice = Number(purchase.unitPrice) || 0

    const entry = {
      id: uid(),
      type: 'entrada',
      date: purchase.date || new Date().toISOString().slice(0, 10),
      supplier: (purchase.supplier || '').trim(),
      quantity,
      unitPrice,
      subtotal: quantity * unitPrice,
      note: purchase.note || '',
      createdAt: new Date().toISOString()
    }

    m.stock = (Number(m.stock) || 0) + quantity
    m.price = unitPrice
    if (entry.supplier) m.supplier = entry.supplier
    m.movements = [...(m.movements || []), entry]
    m.updatedAt = new Date().toISOString()

    return { ok: true, entry, stock: m.stock }
  }

  /** Registra una salida de stock (consumo) como movimiento */
  function removeStock(id, quantity = 1, note = '') {
    const m = materials.value.find(x => x.id === id)
    if (!m) return { blocked: true, reason: 'not-found' }
    const qty = Math.abs(Number(quantity) || 0)
    if (qty <= 0) return { blocked: true, reason: 'invalid-quantity' }

    const entry = {
      id: uid(),
      type: 'salida',
      date: new Date().toISOString().slice(0, 10),
      supplier: '',
      quantity: qty,
      unitPrice: Number(m.price) || 0,
      subtotal: qty * (Number(m.price) || 0),
      note,
      createdAt: new Date().toISOString()
    }

    m.stock = Math.max(0, (Number(m.stock) || 0) - qty)
    m.movements = [...(m.movements || []), entry]
    m.updatedAt = new Date().toISOString()

    return { ok: true, entry, stock: m.stock }
  }

  function removeMovement(id, movementId) {
    const m = materials.value.find(x => x.id === id)
    if (!m) return
    const mv = (m.movements || []).find(p => p.id === movementId)
    if (!mv) return
    const delta = mv.type === 'entrada' ? -1 : 1
    m.stock = Math.max(0, (Number(m.stock) || 0) + delta * (Number(mv.quantity) || 0))
    m.movements = (m.movements || []).filter(p => p.id !== movementId)
    m.updatedAt = new Date().toISOString()
  }

  /** Historial de movimientos de un material */
  function movementsOf(id) {
    const m = materials.value.find(x => x.id === id)
    if (!m) return []
    return [...(m.movements || [])].sort((a, b) =>
      (b.date || '').localeCompare(a.date || '') ||
      (b.createdAt || '').localeCompare(a.createdAt || '')
    )
  }

  /** Total invertido en un material (suma de subtotales de entradas) */
  function totalInvested(id) {
    return movementsOf(id)
      .filter(mv => mv.type === 'entrada')
      .reduce((s, p) => s + (Number(p.subtotal) || 0), 0)
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
    if (delta < 0) return removeStock(id, Math.abs(delta), 'Consumo rápido')
    if (delta > 0) {
      m.stock = (Number(m.stock) || 0) + delta
      m.movements = [...(m.movements || []), {
        id: uid(),
        type: 'entrada',
        date: new Date().toISOString().slice(0, 10),
        supplier: m.supplier || '',
        quantity: delta,
        unitPrice: Number(m.price) || 0,
        subtotal: delta * (Number(m.price) || 0),
        note: 'Ajuste manual',
        createdAt: new Date().toISOString()
      }]
    }
    m.updatedAt = new Date().toISOString()
  }

  /** Todos los movimientos de todos los materiales (para el apartado Movimientos) */
  const allMovements = computed(() => {
    const list = []
    for (const m of materials.value) {
      for (const mv of m.movements || []) {
        list.push({
          ...mv,
          materialId: m.id,
          materialName: m.name,
          materialCode: m.code,
          unit: m.unit,
          category: m.category
        })
      }
    }
    return list.sort((a, b) =>
      (b.date || '').localeCompare(a.date || '') ||
      (b.createdAt || '').localeCompare(a.createdAt || '')
    )
  })

  const movementStats = computed(() => {
    const entradas = allMovements.value.filter(mv => mv.type === 'entrada')
    const salidas = allMovements.value.filter(mv => mv.type === 'salida')
    return {
      entries: entradas.length,
      exits: salidas.length,
      inQuantity: entradas.reduce((s, mv) => s + (Number(mv.quantity) || 0), 0),
      outQuantity: salidas.reduce((s, mv) => s + (Number(mv.quantity) || 0), 0),
      inValue: entradas.reduce((s, mv) => s + (Number(mv.subtotal) || 0), 0),
      outValue: salidas.reduce((s, mv) => s + (Number(mv.subtotal) || 0), 0)
    }
  })

  function getById(id) { return materials.value.find(m => m.id === id) }
  function reset() { materials.value = [] }

  return {
    materials, stats, lowStockItems, usedSuppliers, allMovements, movementStats,
    addMaterial, updateMaterial, removeMaterial, adjustStock, getById, reset,
    addStock, removeStock, removeMovement, movementsOf, totalInvested
  }
})