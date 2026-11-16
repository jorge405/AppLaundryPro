import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'

export const MACHINE_TYPES = [
  { id: 'lavadora', label: 'Lavadora', icon: '🌀', color: 'sky' },
  { id: 'secadora', label: 'Secadora', icon: '💨', color: 'amber' },
  { id: 'plancha', label: 'Plancha', icon: '♨️', color: 'rose' },
  { id: 'vapor', label: 'Vaporera', icon: '☁️', color: 'violet' },
  { id: 'centrifuga', label: 'Centrífuga', icon: '⚙️', color: 'emerald' },
  { id: 'aspiradora', label: 'Aspiradora', icon: '🌪️', color: 'slate' }
]

export const MACHINE_STATUSES = [
  { id: 'operativa', label: 'Operativa', color: 'emerald' },
  { id: 'mantenimiento', label: 'En mantenimiento', color: 'amber' },
  { id: 'averiada', label: 'Averiada', color: 'rose' },
  { id: 'inactiva', label: 'Inactiva', color: 'slate' }
]

export const useMachinesStore = defineStore('machines', () => {
  const machines = ref(storage.get('machines', []))

  watch(machines, (v) => storage.set('machines', v), { deep: true })

  const stats = computed(() => {
    const by = (s) => machines.value.filter(m => m.status === s).length
    return {
      total: machines.value.length,
      operativa: by('operativa'),
      mantenimiento: by('mantenimiento'),
      averiada: by('averiada'),
      inactiva: by('inactiva')
    }
  })

  function addMachine(data) {
    const item = {
      id: uid(),
      code: `MAQ-${String(machines.value.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{ at: new Date().toISOString(), status: data.status || 'operativa', note: 'Alta de máquina' }],
      maintenance: null,
      breakdown: null,
      ...data
    }
    machines.value.unshift(item)
    return item
  }

  function updateMachine(id, data) {
    const idx = machines.value.findIndex(m => m.id === id)
    if (idx === -1) return
    const prev = machines.value[idx]
    const updated = { ...prev, ...data, updatedAt: new Date().toISOString() }
    if (data.status && data.status !== prev.status) {
      updated.history = [...(prev.history || []), { at: updated.updatedAt, status: data.status, note: 'Cambio de estado' }]
    }
    machines.value[idx] = updated
  }

  /**
   * Cambia el estado de una máquina guardando los datos de la incidencia.
   * status: operativa | mantenimiento | averiada | inactiva
   * data: { maintenance: {...} } o { breakdown: {...} }
   */
  function setStatus(id, status, data = {}) {
    const idx = machines.value.findIndex(m => m.id === id)
    if (idx === -1) return
    const prev = machines.value[idx]
    const updated = { ...prev, status, updatedAt: new Date().toISOString() }

    if (status === 'mantenimiento') {
      updated.maintenance = {
        sentDate: data.maintenance?.sentDate || '',
        pickupDate: data.maintenance?.pickupDate || '',
        place: data.maintenance?.place || '',
        supplier: data.maintenance?.supplier || '',
        cost: Number(data.maintenance?.cost) || 0,
        notes: data.maintenance?.notes || '',
        registeredAt: new Date().toISOString()
      }
    }

    if (status === 'averiada') {
      updated.breakdown = {
        fault: data.breakdown?.fault || '',
        detectedDate: data.breakdown?.detectedDate || '',
        reportedBy: data.breakdown?.reportedBy || '',
        place: data.breakdown?.place || '',
        supplier: data.breakdown?.supplier || '',
        cost: Number(data.breakdown?.cost) || 0,
        inWorkshop: data.breakdown?.inWorkshop ?? false,
        notes: data.breakdown?.notes || '',
        registeredAt: new Date().toISOString()
      }
    }

    if (status === 'operativa') {
      // vuelve a servicio: se conservan los datos para el historial
      updated.backToServiceDate = new Date().toISOString().slice(0, 10)
    }

    const note =
      status === 'mantenimiento' ? 'Mantenimiento registrado'
      : status === 'averiada' ? 'Avería registrada'
      : status === 'operativa' ? 'Vuelve a servicio'
      : 'Cambio de estado'

    updated.history = [...(prev.history || []), { at: updated.updatedAt, status, note }]
    machines.value[idx] = updated
    return updated
  }

  function removeMachine(id) {
    machines.value = machines.value.filter(m => m.id !== id)
  }

  function getById(id) { return machines.value.find(m => m.id === id) }
  function reset() { machines.value = [] }

  return { machines, stats, addMachine, updateMachine, setStatus, removeMachine, getById, reset }
})