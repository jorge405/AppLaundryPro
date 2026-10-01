import { ref } from 'vue'

const toasts = ref([])
let id = 0

export function useToast() {
  const push = (message, type = 'info', duration = 3000) => {
    const toastId = ++id
    toasts.value.push({ id: toastId, message, type })
    setTimeout(() => remove(toastId), duration)
  }
  const remove = (toastId) => {
    toasts.value = toasts.value.filter(t => t.id !== toastId)
  }
  return {
    toasts,
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
    remove
  }
}