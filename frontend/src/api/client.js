import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ph_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ph_token')
      localStorage.removeItem('ph_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
}

// Vendors
export const vendorApi = {
  list: (params) => api.get('/vendors', { params }),
  create: (data) => api.post('/vendors', data),
  get: (id) => api.get(`/vendors/${id}`),
  update: (id, data) => api.patch(`/vendors/${id}`, data),
  updateStatus: (id, data) => api.post(`/vendors/${id}/status`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
}

// Requisitions
export const prApi = {
  list: (params) => api.get('/requisitions', { params }),
  create: (data) => api.post('/requisitions', data),
  get: (id) => api.get(`/requisitions/${id}`),
  update: (id, data) => api.patch(`/requisitions/${id}`, data),
  submit: (id) => api.post(`/requisitions/${id}/submit`),
}

// Purchase Orders
export const poApi = {
  list: (params) => api.get('/purchase-orders', { params }),
  create: (data) => api.post('/purchase-orders', data),
  get: (id) => api.get(`/purchase-orders/${id}`),
  update: (id, data) => api.patch(`/purchase-orders/${id}`, data),
}
