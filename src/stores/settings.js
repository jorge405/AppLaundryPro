import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/utils/storage'
import { uid } from '@/utils/format'

export const DEFAULT_CURRENCIES = [
  { id: 'bob', code: 'BOB', symbol: 'Bs', name: 'Boliviano', rate: 1, fixed: true },
  { id: 'usd', code: 'USD', symbol: '$', name: 'Dólar estadounidense', rate: 0.145, fixed: true }
]

export const useSettingsStore = defineStore('settings', () => {
  const currencies = ref(storage.get('currencies', DEFAULT_CURRENCIES))
  const activeCurrency = ref(storage.get('activeCurrency', 'bob'))

  watch(currencies, (v) => storage.set('currencies', v), { deep: true })
  watch(activeCurrency, (v) => storage.set('activeCurrency', v))

  const current = computed(() =>
    currencies.value.find(c => c.id === activeCurrency.value) || currencies.value[0]
  )

  function setActive(id) {
    if (currencies.value.some(c => c.id === id)) activeCurrency.value = id
  }

  function addCurrency({ code, symbol, name, rate }) {
    const item = {
      id: uid(),
      code: (code || '').toUpperCase().trim(),
      symbol: symbol || '$',
      name: name || code,
      rate: Number(rate) || 1,
      fixed: false
    }
    currencies.value.push(item)
    return item
  }

  function updateCurrency(id, data) {
    const idx = currencies.value.findIndex(c => c.id === id)
    if (idx === -1) return
    // El boliviano (base) mantiene rate = 1
    if (currencies.value[idx].id === 'bob') data.rate = 1
    currencies.value[idx] = { ...currencies.value[idx], ...data }
  }

  function removeCurrency(id) {
    const c = currencies.value.find(x => x.id === id)
    if (!c || c.fixed) return
    currencies.value = currencies.value.filter(x => x.id !== id)
    if (activeCurrency.value === id) activeCurrency.value = 'bob'
  }

  function convert(amountInBob) {
    return (Number(amountInBob) || 0) * (current.value?.rate || 1)
  }

  function format(amountInBob) {
    const cur = current.value
    if (!cur) return `${amountInBob}`
    const value = convert(amountInBob)
    return `${cur.symbol} ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function reset() {
    currencies.value = [...DEFAULT_CURRENCIES]
    activeCurrency.value = 'bob'
  }

  return {
    currencies,
    activeCurrency,
    current,
    setActive,
    addCurrency,
    updateCurrency,
    removeCurrency,
    convert,
    format,
    reset
  }
})