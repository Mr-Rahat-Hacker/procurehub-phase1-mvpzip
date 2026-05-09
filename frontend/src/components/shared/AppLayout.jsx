import { Outlet } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import ToastContainer from './ToastContainer'
import useAuthStore from '../../store/authStore'
import { Settings, HelpCircle } from 'lucide-react'

export default function AppLayout() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Shell Bar */}
      <header className="shell-bar">
        <div className="shell-logo">
          <div className="shell-logo-icon">P</div>
          <span>ProcureHub</span>
        </div>
        <div className="shell-divider" />
        <span className="shell-title">Enterprise Procurement Management</span>
        <div className="shell-spacer" />
        <button className="shell-btn" onClick={() => navigate('/settings')}>
          <Settings size={14} />
          <span>Settings</span>
        </button>
        <div className="shell-divider" />
        <div className="shell-user">
          <div className="shell-avatar">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{user?.full_name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
              {user?.role?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </header>

      {/* Left Nav */}
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      <ToastContainer />
    </div>
  )
}
