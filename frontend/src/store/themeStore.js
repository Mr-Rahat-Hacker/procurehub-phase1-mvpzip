import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(persist(
  (set, get) => ({
    theme: 'dark',
    toggleTheme: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark'
      set({ theme: next })
      document.documentElement.setAttribute('data-theme', next)
    },
    initTheme: () => {
      const t = get().theme || 'dark'
      document.documentElement.setAttribute('data-theme', t)
    },
  }),
  { name: 'ph_theme' }
))

export default useThemeStore
