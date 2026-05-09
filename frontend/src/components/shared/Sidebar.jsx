import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import {
  LayoutDashboard, Users, FileText, ShoppingCart,
  Package, LogOut, Settings, FileSearch, Truck,
  BarChart2, Activity, Sun, Moon, UserCog, ChevronRight
} from 'lucide-react'

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }
  const isAdmin = ['admin', 'procurement_manager'].includes(user?.role)

  const procurementNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vendors', icon: Users, label: 'Vendor Master' },
    { to: '/requisitions', icon: FileText, label: 'Purchase Requisitions' },
    { to: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
    { to: '/rfqs', icon: FileSearch, label: 'Request for Quotation' },
    { to: '/grns', icon: Truck, label: 'Goods Receipt' },
  ]

  const mgmtNav = [
    { to: '/reports', icon: BarChart2, label: 'Reports & Analytics' },
    ...(isAdmin ? [
      { to: '/users', icon: UserCog, label: 'User Management' },
      { to: '/audit-log', icon: Activity, label: 'Audit Log' },
    ] : []),
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="left-nav">
      <div className="nav-section-title">Procurement</div>
      {procurementNav.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={14} />
          <span style={{ flex: 1, fontSize: 12 }}>{label}</span>
        </NavLink>
      ))}

      <div className="nav-separator" />

      <div className="nav-section-title">Administration</div>
      {mgmtNav.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={14} />
          <span style={{ flex: 1, fontSize: 12 }}>{label}</span>
        </NavLink>
      ))}

      <div style={{ flex: 1 }} />

      <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
        <button
          onClick={toggleTheme}
          className="nav-item"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'var(--font-sans)' }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span style={{ flex: 1, fontSize: 12 }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'var(--font-sans)', color: 'var(--red)' }}
        >
          <LogOut size={14} style={{ color: 'var(--red)' }} />
          <span style={{ flex: 1, fontSize: 12 }}>Sign Out</span>
        </button>
      </div>
    </nav>
  )
}
