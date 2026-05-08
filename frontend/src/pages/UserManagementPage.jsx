import { useEffect, useState } from 'react'
import { usersApi } from '../api/client'
import useAuthStore from '../store/authStore'
import { Users, Plus, X, Edit2, UserX, UserCheck } from 'lucide-react'

const roleBadge = {
  admin: 'badge-red', procurement_manager: 'badge-blue', buyer: 'badge-accent',
  approver: 'badge-amber', vendor: 'badge-purple',
}

export default function UserManagementPage() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'buyer', department: '', is_active: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const roles = ['admin', 'procurement_manager', 'buyer', 'approver', 'vendor']
  const depts = ['Production', 'Maintenance', 'Quality', 'Stores', 'Admin', 'IT', 'HR', 'Finance', 'Engineering']

  const load = () => {
    usersApi.list().then(r => { setUsers(r.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditUser(null)
    setForm({ email: '', full_name: '', password: '', role: 'buyer', department: '', is_active: true })
    setError('')
    setShowModal(true)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({ email: u.email, full_name: u.full_name, password: '', role: u.role, department: u.department || '', is_active: u.is_active })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editUser) {
        const payload = { full_name: form.full_name, role: form.role, department: form.department, is_active: form.is_active }
        await usersApi.update(editUser.id, payload)
      } else {
        if (!form.password) { setError('Password required'); setSaving(false); return }
        await usersApi.create(form)
      }
      setShowModal(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Operation failed')
    } finally { setSaving(false) }
  }

  const toggleActive = async (u) => {
    if (u.id === user?.id) return
    await usersApi.update(u.id, { is_active: !u.is_active })
    load()
  }

  if (user?.role !== 'admin' && user?.role !== 'procurement_manager') {
    return <div className="empty-state"><h3>Access Denied</h3><p>Admin or Procurement Manager access required</p></div>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users, roles and access</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add User</button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: users.length, color: 'var(--blue)' },
          { label: 'Active', value: users.filter(u => u.is_active).length, color: 'var(--green)' },
          { label: 'Inactive', value: users.filter(u => !u.is_active).length, color: 'var(--red)' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'var(--purple)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th><th></th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 600, color: 'var(--accent)', flexShrink: 0,
                        }}>
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        {u.full_name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{u.email}</td>
                    <td><span className={`badge ${roleBadge[u.role] || 'badge-muted'}`}>{u.role.replace(/_/g, ' ')}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      {user?.role === 'admin' && u.id !== user?.id && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} title="Edit"><Edit2 size={13} /></button>
                          <button className={`btn btn-ghost btn-sm`} onClick={() => toggleActive(u)} title={u.is_active ? 'Deactivate' : 'Activate'} style={{ color: u.is_active ? 'var(--red)' : 'var(--green)' }}>
                            {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="input-label">Full Name *</label>
                <input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required placeholder="Full name" />
              </div>
              {!editUser && (
                <>
                  <div className="form-group">
                    <label className="input-label">Email *</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="user@company.com" />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Password *</label>
                    <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                  </div>
                </>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Role *</label>
                  <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Department</label>
                  <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="">No department</option>
                    {depts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              {editUser && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ accentColor: 'var(--accent)' }} />
                    <span className="input-label" style={{ margin: 0 }}>Active User</span>
                  </label>
                </div>
              )}
              {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
