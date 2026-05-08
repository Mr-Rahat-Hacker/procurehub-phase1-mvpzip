import { create } from 'zustand'
import { authApi } from '../api/client'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('ph_user') || 'null'),
  token: localStorage.getItem('ph_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await authApi.login({ email, password })
      const { access_token, user } = res.data
      localStorage.setItem('ph_token', access_token)
      localStorage.setItem('ph_user', JSON.stringify(user))
      set({ user, token: access_token, loading: false })
      return true
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Login failed', loading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('ph_token')
    localStorage.removeItem('ph_user')
    set({ user: null, token: null })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
