import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'

const ROLES = ['buyer', 'procurement_manager', 'approver', 'admin']
const DEPTS = ['Engineering', 'Manufacturing', 'IT', 'HR', 'Finance', 'Operations', 'R&D', 'Quality', 'Logistics', 'Admin']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'buyer', department: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', color: '#0a0e1a', fontFamily: 'var(--font-mono)' }}>P</div>
            <span style={{ fontSize: '20px', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>ProcureHub</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create your account</p>
        </div>
        <div className="card" style={{ padding: '28px' }}>
          {error && <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--red)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label className="input-label">Full Name</label><input className="input" required value={form.full_name} onChange={e => set('full_name', e.target.value)} /></div>
            <div className="form-group"><label className="input-label">Email</label><input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label className="input-label">Password</label><input className="input" type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} /></div>
            <div className="form-row">
              <div className="form-group"><label className="input-label">Role</label>
                <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="input-label">Department</label>
                <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
                  <option value="">Select dept</option>
                  {DEPTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', width: '100%', padding: '10px', marginTop: '4px' }}>
              {loading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Already have an account? <a href="/login" style={{ color: 'var(--accent)' }}>Sign in</a>
          </p>
        </div>
      </div>
    </div>
  )
}
