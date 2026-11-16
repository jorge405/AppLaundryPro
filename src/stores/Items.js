import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'

export const CATEGORIES = [
  { id: 'traje',   label: 'Traje',   icon: '🤵', color: 'indigo'  },
  { id: 'cama',    label: 'Cama',    icon: '🛏️', color: 'violet'  },
  { id: 'ropa',    label: 'Ropa',    icon: '👕', color: 'sky'     },
  { id: 'toalla',  label: 'Toalla',  icon: '🧺', color: 'emerald' },
  { id: 'cortina', label: 'Cortina', icon: '🪟', color: 'amber'   },
  { id: 'otro',    label: 'Otro',    icon: '📦', color: 'slate'   }
]

// ✅ Eliminado "entregado"
export const STATUSES = [
  { id: 'pendiente',  label: 'Pendiente',  color: 'amber'   },
  { id: 'lavando',    label: 'Lavando',    color: 'sky'     },
  { id: 'secando',    label: 'Secando',    color: 'violet'  },
  { id: 'planchando', label: 'Planchando', color: 'rose'    },
  { id: 'listo',      label: 'Listo',      color: 'emerald' },
  { id: 'cobrado',    label: 'Cobrado',    color: 'teal'    }
]

export const useItemsStore = defineStore('items', () => {
  const items = ref(storage.get('items', []))

  watch(items, (v) => storage.set('items', v), { deep: true })

  const stats = computed(() => {
    const by = (s) => items.value.filter(i => i.status === s).length
    return {
      total: items.value.length,
      pendiente: by('pendiente'),
      enProceso: items.value.filter(i => ['lavando', 'secando', 'planchando'].includes(i.status)).length,
      listo: by('listo'),
      cobrado: by('cobrado'),
      ingresos: items.value
        .filter(i => i.status === 'cobrado' && !i.cancelled && !i.archived)
        .reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0)
    }
  })

  const byCategory = computed(() => {
    const map = {}
    for (const c of CATEGORIES) map[c.id] = 0
    items.value.forEach(i => { map[i.category] = (map[i.category] || 0) + 1 })
    return map
  })

  function isStatusLocked(item) {
    return item?.status === 'cobrado'
  }

  function canChangeStatus(item, newStatus) {
    if (!item) return false
    if (item.status === 'cobrado') return false
    return true
  }

  function addItem(data) {
    const item = {
      id: uid(),
      code: `LP-${String(items.value.length + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paidAt: null,
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

    if (data.status && data.status !== prev.status && !canChangeStatus(prev, data.status)) {
      return { blocked: true, reason: 'status-locked' }
    }

    const updated = { ...prev, ...data, updatedAt: new Date().toISOString() }
    if (data.status && data.status !== prev.status) {
      if (data.status === 'cobrado') updated.paidAt = updated.updatedAt
      updated.history = [...(prev.history || []), { at: updated.updatedAt, status: data.status, note: 'Cambio de estado' }]
    }
    items.value[idx] = updated
    return updated
  }

  function removeItem(id) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function advanceStatus(id) {
    const item = items.value.find(i => i.id === id)
    if (!item) return { blocked: true }
    if (isStatusLocked(item)) return { blocked: true, reason: 'locked' }

    const order = STATUSES.map(s => s.id)
    const idx = order.indexOf(item.status)
    const next = order[Math.min(idx + 1, order.length - 1)]
    if (next !== item.status) return updateItem(id, { status: next })
    return { blocked: true }
  }

  function chargeItem(id) {
    return updateItem(id, { status: 'cobrado' })
  }

  function getById(id) { return items.value.find(i => i.id === id) }
  function reset() { items.value = [] }

  // ====== CANCELAR / ARCHIVAR ======
  // En lugar de borrar, una prenda (o pedido) se puede cancelar o archivar.

  function cancelItem(id) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    item.cancelled = true
    item.archived = false
    item.updatedAt = new Date().toISOString()
  }

  function reactivateItem(id) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    item.cancelled = false
    item.archived = false
    item.updatedAt = new Date().toISOString()
  }

  function archiveItem(id) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    item.archived = true
    item.updatedAt = new Date().toISOString()
  }

  function unarchiveItem(id) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    item.archived = false
    item.updatedAt = new Date().toISOString()
  }

  function cancelOrder(id) {
    for (const i of items.value.filter(x => groupKey(x) === id)) cancelItem(i.id)
  }

  function reactivateOrder(id) {
    for (const i of items.value.filter(x => groupKey(x) === id)) reactivateItem(i.id)
  }

  function archiveOrder(id) {
    for (const i of items.value.filter(x => groupKey(x) === id)) archiveItem(i.id)
  }

  function unarchiveOrder(id) {
    for (const i of items.value.filter(x => groupKey(x) === id)) unarchiveItem(i.id)
  }

  // ====== PEDIDOS (grupo de prendas del mismo cliente) ======
  // Cada prenda se guarda como un item independiente (quantity = 1),
  // pero todas las prendas registradas juntas comparten groupId/groupCode.

  const groupKey = (item) => item?.groupId || item?.id

  function nextGroupCode() {
    const nums = items.value
      .map(i => String(i.groupCode || '').replace(/[^0-9]/g, ''))
      .filter(Boolean)
      .map(Number)
    const max = nums.length ? Math.max(...nums) : 0
    return `ORD-${String(max + 1).padStart(4, '0')}`
  }

  function nextItemCode(offset = 0) {
    return `LP-${String(items.value.length + offset + 1).padStart(4, '0')}`
  }

  function buildItem(base, extra) {
    const now = new Date().toISOString()
    return {
      id: uid(),
      code: '',
      groupId: base.groupId,
      groupCode: base.groupCode,
      createdAt: now,
      updatedAt: now,
      paidAt: null,
      history: [{ at: now, status: extra.status || 'pendiente', note: 'Creación' }],
      ...base,
      ...extra
    }
  }

  /**
   * Crea un pedido: cada prenda se registra 1 por 1.
   * lines: [{ name, category, quantity, price }]
   */
  function addOrder(payload = {}) {
    const groupId = uid()
    const groupCode = nextGroupCode()
    const header = {
      clientName: (payload.clientName || '').trim(),
      clientPhone: (payload.clientPhone || '').trim(),
      clientPhone2: (payload.clientPhone2 || '').trim(),
      pickup: payload.pickup || '',
      delivery: payload.delivery || '',
      notes: payload.notes || '',
      status: payload.status || 'pendiente',
      branchId: payload.branchId || '',
      branchName: payload.branchName || ''
    }

    const created = []
    const lines = (payload.lines || []).filter(l => l?.name?.trim())

    for (const l of lines) {
      const qty = Math.max(1, Number(l.quantity) || 1)
      for (let k = 0; k < qty; k++) {
        const item = buildItem({ groupId, groupCode }, {
          ...header,
          name: l.name.trim(),
          category: l.category || 'ropa',
          price: Number(l.price) || 0,
          quantity: 1
        })
        item.code = nextItemCode(created.length)
        created.push(item)
      }
    }

    if (created.length) {
      // unshift mantiene el orden de las prendas dentro del pedido
      items.value.unshift(...created.slice().reverse())
    }

    return { groupId, groupCode, items: created }
  }

  /**
   * Actualiza un pedido completo (header + líneas).
   * lines: [{ id?, name, category, quantity, price }]
   */
  function updateOrder(groupId, payload = {}) {
    const current = items.value.filter(i => groupKey(i) === groupId)
    if (!current.length) return { blocked: true, reason: 'not-found' }

    const header = {
      clientName: (payload.clientName ?? current[0].clientName ?? '').trim(),
      clientPhone: (payload.clientPhone ?? current[0].clientPhone ?? '').trim(),
      clientPhone2: (payload.clientPhone2 ?? current[0].clientPhone2 ?? '').trim(),
      pickup: payload.pickup ?? current[0].pickup ?? '',
      delivery: payload.delivery ?? current[0].delivery ?? '',
      notes: payload.notes ?? current[0].notes ?? '',
      status: payload.status || current[0].status,
      branchId: payload.branchId ?? current[0].branchId ?? '',
      branchName: payload.branchName ?? current[0].branchName ?? ''
    }

    const lines = (payload.lines || []).filter(l => l?.name?.trim())
    const keepIds = new Set()
    const dropIds = new Set()
    let added = 0

    for (const l of lines) {
      const qty = Math.max(1, Number(l.quantity) || 1)
      const existing = l.id ? items.value.find(i => i.id === l.id && groupKey(i) === groupId) : null

      if (existing && (qty === 1 || existing.status === 'cobrado')) {
        // la prenda ya existe y se mantiene 1 a 1
        keepIds.add(existing.id)
        items.value = items.value.map(i => i.id === existing.id ? {
          ...i,
          ...header,
          status: i.status === 'cobrado' ? i.status : header.status,
          name: l.name.trim(),
          category: l.category || i.category,
          price: Number(l.price) || 0,
          updatedAt: new Date().toISOString()
        } : i)
      } else {
        // se expande la cantidad: se reemplaza por N prendas del mismo pedido
        if (existing) dropIds.add(existing.id)
        for (let k = 0; k < qty; k++) {
          const item = buildItem({ groupId, groupCode: current[0].groupCode || current[0].code }, {
            ...header,
            name: l.name.trim(),
            category: l.category || 'ropa',
            price: Number(l.price) || 0,
            quantity: 1
          })
          item.code = nextItemCode(added)
          added++
          items.value.unshift(item)
        }
      }
    }

    // líneas eliminadas (no se borran si ya están cobradas)
    const removed = current.filter(i => !keepIds.has(i.id) && !dropIds.has(i.id) && i.status !== 'cobrado')
    const dropped = current.filter(i => dropIds.has(i.id) && i.status !== 'cobrado')
    const toRemove = [...removed, ...dropped]
    if (toRemove.length) {
      items.value = items.value.filter(i => !toRemove.some(r => r.id === i.id))
    }

    return { ok: true, removed: toRemove.length }
  }

  /** Todos los pedidos agrupados por cliente/registro */
  const orders = computed(() => {
    const map = new Map()
    for (const i of items.value) {
      const key = groupKey(i)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(i)
    }

    const order = STATUSES.map(s => s.id)

    return [...map.entries()].map(([key, list]) => {
      const lines = [...list].sort((a, b) =>
        (a.createdAt || '').localeCompare(b.createdAt || '') || (a.code || '').localeCompare(b.code || '')
      )
      const subtotal = lines.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)
      const idxs = lines.map(i => order.indexOf(i.status))
      const status = order[Math.min(...idxs.filter(x => x >= 0), 0)] || 'pendiente'
      const first = lines[0]

      return {
        id: key,
        code: first.groupCode || first.code,
        groupCode: first.groupCode || null,
        items: lines,
        lines,
        count: lines.length,
        status,
        cancelled: lines.every(i => i.cancelled),
        archived: lines.every(i => i.archived),
        clientName: first.clientName || '',
        clientPhone: first.clientPhone || '',
        clientPhone2: first.clientPhone2 || '',
        branchId: first.branchId || '',
        branchName: first.branchName || '',
        pickup: first.pickup || '',
        delivery: first.delivery || '',
        notes: first.notes || '',
        subtotal,
        total: subtotal,
        createdAt: first.createdAt,
        updatedAt: lines.map(i => i.updatedAt).sort().slice(-1)[0] || first.updatedAt
      }
    })
  })

  function getOrderById(id) {
    return orders.value.find(o => o.id === id) || null
  }

  function getOrderByItem(item) {
    if (!item) return null
    return getOrderById(groupKey(item))
  }

  function getOrderByItemId(itemId) {
    const it = getById(itemId)
    return it ? getOrderByItem(it) : null
  }

  /** Cobra todas las prendas de un pedido */
  function chargeOrder(id) {
    const list = items.value.filter(i => groupKey(i) === id)
    if (!list.length) return { blocked: true }
    let charged = 0
    for (const i of list) {
      if (i.status === 'cobrado') continue
      const res = updateItem(i.id, { status: 'cobrado' })
      if (res && !res.blocked) charged++
    }
    return { ok: true, charged }
  }

  // ====== GANANCIAS ======
  const paidItems = computed(() =>
    items.value.filter(i => i.status === 'cobrado' && i.paidAt && !i.cancelled && !i.archived)
  )

  /**
   * Retorna array de { date: 'YYYY-MM-DD', total, count } ordenado desc
   */
  const earningsByDay = computed(() => {
    const map = {}
    for (const i of paidItems.value) {
      const d = i.paidAt.slice(0, 10)
      if (!map[d]) map[d] = { date: d, total: 0, count: 0 }
      map[d].total += (Number(i.price) || 0) * (Number(i.quantity) || 1)
      map[d].count++
    }
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
  })

  /**
   * Retorna array de { month: 'YYYY-MM', total, count } ordenado desc
   */
  const earningsByMonth = computed(() => {
    const map = {}
    for (const i of paidItems.value) {
      const m = i.paidAt.slice(0, 7)
      if (!map[m]) map[m] = { month: m, total: 0, count: 0 }
      map[m].total += (Number(i.price) || 0) * (Number(i.quantity) || 1)
      map[m].count++
    }
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month))
  })

  /**
   * Totales generales + rango de fechas
   */
  function earningsInRange(fromISO, toISO) {
    const from = fromISO ? new Date(fromISO + 'T00:00:00').getTime() : 0
    const to = toISO ? new Date(toISO + 'T23:59:59').getTime() : Date.now()
    const list = paidItems.value.filter(i => {
      const t = new Date(i.paidAt).getTime()
      return t >= from && t <= to
    })
    const total = list.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0)
    return { total, count: list.length, items: list }
  }

  const totalEarnings = computed(() =>
    paidItems.value.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0)
  )

  /**
   * Ingresos por mes de una sucursal (o de todas si no se indica).
   * Devuelve [{ month: 'YYYY-MM', total, count }] desc.
   */
  function earningsByMonthOf(branchId = null) {
    const map = {}
    for (const i of paidItems.value) {
      if (branchId && i.branchId !== branchId) continue
      const m = i.paidAt.slice(0, 7)
      if (!map[m]) map[m] = { month: m, total: 0, count: 0 }
      map[m].total += (Number(i.price) || 0) * (Number(i.quantity) || 1)
      map[m].count++
    }
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month))
  }

  /** Últimos N meses (incluye meses sin ingresos con total 0) */
  function monthlyTrend(branchId = null, months = 6) {
    const data = earningsByMonthOf(branchId)
    const out = []
    const now = new Date()
    for (let k = months - 1; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const found = data.find(x => x.month === key)
      out.push({ month: key, total: found?.total || 0, count: found?.count || 0 })
    }
    return out
  }

  /** Ingresos del mes en curso de una sucursal */
  function monthEarningsOf(branchId = null) {
    const m = new Date().toISOString().slice(0, 7)
    return paidItems.value
      .filter(i => i.branchId === branchId && i.paidAt.slice(0, 7) === m)
      .reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0)
  }

  const todayEarnings = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return earningsInRange(today, today).total
  })

  const monthEarnings = computed(() => {
    const m = new Date().toISOString().slice(0, 7)
    return paidItems.value
      .filter(i => i.paidAt.slice(0, 7) === m)
      .reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0)
  })

  return {
    items, stats, byCategory,
    addItem, updateItem, removeItem, advanceStatus, chargeItem, getById, reset,
    canChangeStatus, isStatusLocked,
    cancelItem, reactivateItem, archiveItem, unarchiveItem,
    cancelOrder, reactivateOrder, archiveOrder, unarchiveOrder,
    addOrder, updateOrder, orders, getOrderById, getOrderByItem, getOrderByItemId, chargeOrder,
    paidItems, earningsByDay, earningsByMonth, earningsInRange,
    earningsByMonthOf, monthlyTrend, monthEarningsOf,
    totalEarnings, todayEarnings, monthEarnings
  }
})