import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'

export const useSuppliersStore = defineStore('suppliers', () => {
  const suppliers = ref(storage.get('suppliers', []))

  watch(suppliers, (v) => storage.set('suppliers', v), { deep: true })

  const list = computed(() =>
    [...suppliers.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  )

  const names = computed(() => list.value.map(s => s.name).filter(Boolean))

  function addSupplier({ name, phone = '', notes = '' }) {
    const clean = (name || '').trim()
    if (!clean) return null
    const exists = suppliers.value.find(
      s => (s.name || '').toLowerCase() === clean.toLowerCase()
    )
    if (exists) return exists
    const item = {
      id: uid(),
      name: clean,
      phone: (phone || '').trim(),
      notes: (notes || '').trim(),
      createdAt: new Date().toISOString()
    }
    suppliers.value.unshift(item)
    return item
  }

  function updateSupplier(id, data) {
    const idx = suppliers.value.findIndex(s => s.id === id)
    if (idx === -1) return
    suppliers.value[idx] = { ...suppliers.value[idx], ...data }
  }

  function removeSupplier(id) {
    suppliers.value = suppliers.value.filter(s => s.id !== id)
  }

  function getById(id) { return suppliers.value.find(s => s.id === id) }

  return { suppliers, list, names, addSupplier, updateSupplier, removeSupplier, getById }
})
