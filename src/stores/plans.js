import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'

export const DEFAULT_PLANS = [
  {
    id: 'plan-basico',
    name: 'Básico',
    price: 0,
    durationDays: 365,
    maxItems: 50,
    maxClients: 1,
    features: ['Hasta 50 prendas/mes', '1 usuario', 'Soporte por email'],
    color: 'sky',
    fixed: true
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    price: 480,           // Bs / año
    durationDays: 365,
    maxItems: 500,
    maxClients: 3,
    features: ['Prendas ilimitadas', '3 usuarios', 'Reportes de ganancias', 'Soporte prioritario'],
    color: 'indigo',
    fixed: true
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    price: 1200,
    durationDays: 365,
    maxItems: -1,         // ilimitado
    maxClients: -1,
    features: ['Todo ilimitado', 'Usuarios ilimitados', 'Reportes avanzados', 'Módulo de máquinas', 'Soporte 24/7'],
    color: 'violet',
    fixed: true
  }
]

export const usePlansStore = defineStore('plans', () => {
  const plans = ref(storage.get('plans', DEFAULT_PLANS))

  watch(plans, (v) => storage.set('plans', v), { deep: true })

  function addPlan(data) {
    const plan = {
      id: uid(),
      name: data.name,
      price: Number(data.price) || 0,
      durationDays: Number(data.durationDays) || 365,
      maxItems: Number(data.maxItems) || 0,
      maxClients: Number(data.maxClients) || 1,
      features: data.features || [],
      color: data.color || 'indigo',
      fixed: false
    }
    plans.value.push(plan)
    return plan
  }

  function updatePlan(id, data) {
    const idx = plans.value.findIndex(p => p.id === id)
    if (idx === -1) return
    plans.value[idx] = { ...plans.value[idx], ...data }
  }

  function removePlan(id) {
    const p = plans.value.find(x => x.id === id)
    if (!p || p.fixed) return
    plans.value = plans.value.filter(x => x.id !== id)
  }

  function getById(id) { return plans.value.find(p => p.id === id) }
  function reset() { plans.value = [...DEFAULT_PLANS] }

  return { plans, addPlan, updatePlan, removePlan, getById, reset }
})