import axios from 'axios'
import useAuthStore from '../store/authStore'

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
      const { forceLogout } = useAuthStore.getState()
      forceLogout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
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

// RFQ
export const rfqApi = {
  list: (params) => api.get('/rfqs', { params }),
  create: (data) => api.post('/rfqs', data),
  get: (id) => api.get(`/rfqs/${id}`),
  update: (id, data) => api.patch(`/rfqs/${id}`, data),
  send: (id) => api.post(`/rfqs/${id}/send`),
  award: (rfqId, quotId) => api.post(`/rfqs/${rfqId}/award/${quotId}`),
  getQuotations: (id) => api.get(`/rfqs/${id}/quotations`),
  submitQuotation: (id, data) => api.post(`/rfqs/${id}/quotations`, data),
}

// GRN
export const grnApi = {
  list: (params) => api.get('/grns', { params }),
  create: (data) => api.post('/grns', data),
  get: (id) => api.get(`/grns/${id}`),
  update: (id, data) => api.patch(`/grns/${id}`, data),
}

// Users
export const usersApi = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.patch(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
}

// Audit
export const auditApi = {
  list: (params) => api.get('/audit-logs', { params }),
  export: () => api.get('/audit-logs/export', { responseType: 'blob' }),
}

// Reports
export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  spendByVendor: () => api.get('/reports/spend-by-vendor'),
  spendByDept: () => api.get('/reports/spend-by-department'),
  monthlySpend: () => api.get('/reports/monthly-spend'),
  prStatusBreakdown: () => api.get('/reports/pr-status-breakdown'),
  topItems: () => api.get('/reports/top-items'),
}

// Governance
export const governanceApi = {
  createApprovalRule: (data) => api.post('/governance/approval-rules', data),
  createApprovalTasks: (resourceType, resourceId) =>
    api.post(`/governance/approval-tasks/${resourceType}/${resourceId}`),
  actionApprovalTask: (taskId, data) => api.post(`/governance/approval-tasks/${taskId}/action`, data),
  createBudget: (data) => api.post('/governance/budgets', data),
  checkBudget: (data, reserve = true) => api.post(`/governance/budgets/check?reserve=${reserve}`, data),
  commitBudget: (data) => api.post('/governance/budgets/commit', data),
  createInvoice: (data) => api.post('/governance/invoices', data),
  listInvoiceExceptions: () => api.get('/governance/invoices/exceptions'),
  threeWayMatch: (invoiceId, params) => api.get(`/governance/invoices/${invoiceId}/three-way-match`, { params }),
  createSodPolicy: (data) => api.post('/governance/sod-policies', data),
}
