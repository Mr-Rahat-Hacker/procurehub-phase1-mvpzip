import { useState } from 'react'
import { authApi } from '../api/client'
import useAuthStore from '../store/authStore'
import useToastStore from '../store/toastStore'
import useThemeStore from '../store/themeStore'
import { Sun, Moon, User, Shield } from 'lucide-react'

const DEPTS = ['Engineering', 'Manufacturing', 'IT', 'HR', 'Finance', 'Operations', 'R&D', 'Quality', 'Logistics', 'Admin']

export default function SettingsPage() {
  const { user } = useAuthStore()
  const toast = useToastStore()
  const { theme, toggleTheme } = useThemeStore()
  const [form, setForm] = useState({ full_name: user?.full_name || '', department: user?.department || '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authApi.updateMe(form)
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account preferences and system configuration</p>
        </div>
      </div>

      {/* Account Info */}
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={12} /> Account Information</span>
        </div>
        <div className="panel-body">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['User ID', `USR-${String(user?.id).padStart(5, '0')}`],
                ['Full Name', user?.full_name],
                ['Email Address', user?.email],
                ['Role', user?.role?.replace(/_/g, ' ')],
                ['Department', user?.department || '—'],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '7px 0', fontSize: 12, color: 'var(--text-muted)', width: 140, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</td>
                  <td style={{ padding: '7px 0', fontSize: 13, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-header">
          <span>Edit Profile</span>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Full Name</label>
                <input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="input-label">Department</label>
                <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                  <option value="">No department</option>
                  {DEPTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Display Preferences */}
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-header"><span>Display Preferences</span></div>
        <div className="panel-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Color Theme</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Currently: <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode (Enterprise)'}</strong>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {theme === 'dark' ? <><Sun size={13} /> Switch to Light</> : <><Moon size={13} /> Switch to Dark</>}
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="panel">
        <div className="panel-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={12} /> Security & Access</span>
        </div>
        <div className="panel-body">
          {[
            ['Role', user?.role?.replace(/_/g, ' '), 'Your assigned system role determines what actions you can perform.'],
            ['Session', 'JWT Token (24h)', 'Your session expires every 24 hours. Sign in again to refresh.'],
            ['Password Reset', 'Contact your administrator', 'To change your password, contact your system administrator.'],
          ].map(([label, value, hint]) => (
            <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{value}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
