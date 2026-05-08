import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import {
  LayoutDashboard, Users, FileText, ShoppingCart,
  Package, LogOut, ChevronRight, Settings
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vendors', icon: Users, label: 'Vendors' },
  { to: '/requisitions', icon: FileText, label: 'Requisitions' },
  { to: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
  { to: '/goods-receipt', icon: Package, label: 'Goods Receipt', disabled: true, badge: 'Phase 2' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)', height: '100vh', position: 'fixed', left: 0, top: 0,
      background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '6px',
            background: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 600, fontSize: '14px',
            color: '#0a0e1a', fontFamily: 'var(--font-mono)', flexShrink: 0,
          }}>P</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-mono)', letterSpacing: '-0.3px' }}>
              ProcureHub
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              v1.0 · MVP
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 12px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Main
        </div>
        {navItems.map(({ to, icon: Icon, label, disabled, badge }) => (
          <NavLink
            key={to}
            to={disabled ? '#' : to}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: 'var(--radius-md)',
              marginBottom: '2px', fontSize: '13px',
              color: disabled ? 'var(--text-muted)' : isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              cursor: disabled ? 'not-allowed' : 'pointer',
              textDecoration: 'none',
              transition: 'all var(--transition)',
            })}
          >
            <Icon size={16} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge && (
              <span style={{
                fontSize: '10px', padding: '1px 6px', borderRadius: '99px',
                background: 'var(--purple-dim)', color: 'var(--purple)', fontFamily: 'var(--font-mono)',
              }}>{badge}</span>
            )}
          </NavLink>
        ))}

        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '12px 4px' }} />

        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-dim)' : 'transparent',
            textDecoration: 'none',
          })}
        >
          <Settings size={16} />
          Settings
        </NavLink>
      </nav>

      {/* User footer */}
      <div style={{
        padding: '12px', borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 600, color: 'var(--accent)', flexShrink: 0,
          }}>
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name || 'User'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: '4px', flexShrink: 0 }} title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
