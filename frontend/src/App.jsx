import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import './styles/global.css'

import useThemeStore from './store/themeStore'
import AppLayout from './components/shared/AppLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import VendorsPage from './pages/VendorsPage'
import VendorDetailPage from './pages/VendorDetailPage'
import RequisitionsPage from './pages/RequisitionsPage'
import PRDetailPage from './pages/PRDetailPage'
import NewPRPage from './pages/NewPRPage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'
import PODetailPage from './pages/PODetailPage'
import NewPOPage from './pages/NewPOPage'
import RFQListPage from './pages/RFQListPage'
import NewRFQPage from './pages/NewRFQPage'
import RFQDetailPage from './pages/RFQDetailPage'
import GRNListPage from './pages/GRNListPage'
import NewGRNPage from './pages/NewGRNPage'
import GRNDetailPage from './pages/GRNDetailPage'
import UserManagementPage from './pages/UserManagementPage'
import AuditLogPage from './pages/AuditLogPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import PrintPRPage from './pages/PrintPRPage'
import PrintPOPage from './pages/PrintPOPage'
import PrintRFQPage from './pages/PrintRFQPage'

export default function App() {
  const { initTheme } = useThemeStore()

  useEffect(() => { initTheme() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Print routes — no sidebar */}
        <Route path="/print/pr/:id" element={<ProtectedRoute><PrintPRPage /></ProtectedRoute>} />
        <Route path="/print/po/:id" element={<ProtectedRoute><PrintPOPage /></ProtectedRoute>} />
        <Route path="/print/rfq/:id" element={<ProtectedRoute><PrintRFQPage /></ProtectedRoute>} />

        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="vendors/:id" element={<VendorDetailPage />} />
          <Route path="requisitions" element={<RequisitionsPage />} />
          <Route path="requisitions/new" element={<NewPRPage />} />
          <Route path="requisitions/:id" element={<PRDetailPage />} />
          <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="purchase-orders/new" element={<NewPOPage />} />
          <Route path="purchase-orders/:id" element={<PODetailPage />} />
          <Route path="rfqs" element={<RFQListPage />} />
          <Route path="rfqs/new" element={<NewRFQPage />} />
          <Route path="rfqs/:id" element={<RFQDetailPage />} />
          <Route path="grns" element={<GRNListPage />} />
          <Route path="grns/new" element={<NewGRNPage />} />
          <Route path="grns/:id" element={<GRNDetailPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
