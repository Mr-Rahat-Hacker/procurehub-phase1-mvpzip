import { useState } from 'react'
import { authApi } from '../api/client'
import useAuthStore from '../store/authStore'
import useToastStore from '../store/toastStore'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const toast = useToastStore()
  const [form, setForm] = useState({ full_name: user?.full_name || '', department: user?.department || '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authApi.updateMe(form)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const infoRows = [
    ['Name', user?.full_name],
    ['Email', user?.email],
    ['Role', user?.role?.replace(/_/g, ' ')],
    ['Department', user?.department || '—'],
  ]

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account and system preferences</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Account Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 0', fontSize: '13px' }}>
          {infoRows.map(([k, v]) => [
            <span key={`label-${k}`} style={{ color: 'var(--text-muted)' }}>{k}</span>,
            <span key={`value-${k}`} style={{ fontWeight: 500, textTransform: 'capitalize' }}>{v}</span>,
          ])}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Edit Profile</h3>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="input-label">Full Name</label>
            <input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="input-label">Department</label>
            <input className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Phase 2 Features (Coming Soon)</h3>
        {['SAP MM/SD Integration', 'Email Notifications', 'Audit Log Export', 'User Management', 'Custom Approval Workflows'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
            <span>{f}</span>
            <span className="badge badge-purple" style={{ fontSize: '10px' }}>Phase 2</span>
          </div>
        ))}
      </div>
    </div>
  )
}
