import { create } from 'zustand'

let toastId = 0

const useToastStore = create((set, get) => ({
  toasts: [],
  add: (message, type = 'info', duration = 3500) => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().remove(id), duration)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  success: (msg) => get().add(msg, 'success'),
  error: (msg) => get().add(msg, 'error'),
  info: (msg) => get().add(msg, 'info'),
}))

export default useToastStore
