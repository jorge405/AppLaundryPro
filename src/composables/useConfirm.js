import { ref } from 'vue'

const state = ref({ open: false, title: '', message: '', confirmText: 'Confirmar', cancelText: 'Cancelar', danger: false, resolve: null })

export function useConfirm() {
  const confirm = (opts = {}) => new Promise((resolve) => {
    state.value = {
      open: true,
      title: opts.title || '¿Estás seguro?',
      message: opts.message || '',
      confirmText: opts.confirmText || 'Confirmar',
      cancelText: opts.cancelText || 'Cancelar',
      danger: !!opts.danger,
      resolve
    }
  })

  const close = (result) => {
    state.value.resolve?.(result)
    state.value.open = false
  }

  return { state, confirm, close }
}