import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles/global.css'

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
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
