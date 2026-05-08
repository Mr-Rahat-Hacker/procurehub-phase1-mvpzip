import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import {
  LayoutDashboard, Users, FileText, ShoppingCart,
  Package, LogOut, Settings, FileSearch, Truck,
  BarChart2, Activity, Sun, Moon, UserCog
} from 'lucide-react'

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = ['admin', 'procurement_manager'].includes(user?.role)

  const mainNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vendors', icon: Users, label: 'Vendors' },
    { to: '/requisitions', icon: FileText, label: 'Requisitions' },
    { to: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
    { to: '/rfqs', icon: FileSearch, label: 'RFQ' },
    { to: '/grns', icon: Truck, label: 'Goods Receipt' },
  ]

  const mgmtNav = [
    { to: '/reports', icon: BarChart2, label: 'Reports' },
    ...(isAdmin ? [
      { to: '/users', icon: UserCog, label: 'Users' },
      { to: '/audit-log', icon: Activity, label: 'Audit Log' },
    ] : []),
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      key={to}
      to={to}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: 'var(--radius-md)',
        marginBottom: '2px', fontSize: '13px',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        background: isActive ? 'var(--accent-dim)' : 'transparent',
        textDecoration: 'none',
        transition: 'all var(--transition)',
      })}
    >
      <Icon size={16} />
      <span style={{ flex: 1 }}>{label}</span>
    </NavLink>
  )

  return (
    <aside style={{
      width: 'var(--sidebar-w)', height: '100vh', position: 'fixed', left: 0, top: 0,
      background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', zIndex: 50,
      transition: 'background var(--transition)',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '6px',
            background: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700, fontSize: '14px',
            color: '#0a0e1a', fontFamily: 'var(--font-mono)', flexShrink: 0,
          }}>P</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
              ProcureHub
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              v2.0 · Manufacturing
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 12px 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Procurement
        </div>
        {mainNav.map(item => <NavItem key={item.to} {...item} />)}

        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '10px 4px' }} />

        <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 12px 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Management
        </div>
        {mgmtNav.map(item => <NavItem key={item.to} {...item} />)}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
            marginBottom: 8, transition: 'all var(--transition)', fontFamily: 'var(--font-sans)',
          }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 12px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
          }}>
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
              {user?.full_name || 'User'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role?.replace(/_/g, ' ')}
            </div>
          </div>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: '4px', flexShrink: 0, color: 'var(--text-muted)' }} title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
