import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
    <div style={{ minHeight: '100vh', background: '#354a5e', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        height: 44, background: '#1d2d3e', borderBottom: '1px solid #253547',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10,
      }}>
        <div style={{ width: 24, height: 24, background: '#0a6ed1', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>P</div>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'Segoe UI, Arial, sans-serif' }}>ProcureHub</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Segoe UI, Arial, sans-serif' }}>Enterprise Procurement Management</span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ background: '#ffffff', border: '1px solid #d9d9d9', borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#f5f5f5', borderBottom: '1px solid #d9d9d9' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#32363a', fontFamily: 'Segoe UI, Arial, sans-serif' }}>Create Account</div>
              <div style={{ fontSize: 11, color: '#6a6d70', marginTop: 2, fontFamily: 'Segoe UI, Arial, sans-serif' }}>Register for ProcureHub access</div>
            </div>

            <div style={{ padding: 20 }}>
              {error && (
                <div style={{ background: '#fff1f1', border: '1px solid #f9b4b4', borderRadius: 4, padding: '8px 12px', color: '#bb0000', fontSize: 12, marginBottom: 14, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#32363a', marginBottom: 4, fontFamily: 'Segoe UI, Arial, sans-serif' }}>Full Name *</label>
                  <input className="input" required value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#32363a', marginBottom: 4, fontFamily: 'Segoe UI, Arial, sans-serif' }}>Email Address *</label>
                  <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#32363a', marginBottom: 4, fontFamily: 'Segoe UI, Arial, sans-serif' }}>Password *</label>
                  <input className="input" type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 6 characters" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#32363a', marginBottom: 4, fontFamily: 'Segoe UI, Arial, sans-serif' }}>Role</label>
                    <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                      {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#32363a', marginBottom: 4, fontFamily: 'Segoe UI, Arial, sans-serif' }}>Department</label>
                    <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
                      <option value="">Select</option>
                      {DEPTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: 8, background: loading ? '#5a9fd4' : '#0a6ed1', color: '#fff',
                  border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Segoe UI, Arial, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#6a6d70', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                Already have an account? <Link to="/login" style={{ color: '#0a6ed1' }}>Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 20px', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Segoe UI, Arial, sans-serif', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        © 2026 ProcureHub · Enterprise Procurement Management System · v2.0
      </div>
    </div>
  )
}
