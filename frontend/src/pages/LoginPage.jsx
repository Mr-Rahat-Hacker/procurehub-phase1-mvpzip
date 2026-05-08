import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const { login, loading, error } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(form.email, form.password)
    if (ok) navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 600, fontSize: '16px', color: '#0a0e1a',
              fontFamily: 'var(--font-mono)',
            }}>P</div>
            <span style={{ fontSize: '22px', fontWeight: 500, fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
              ProcureHub
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Enterprise procurement platform</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '24px' }}>Sign in to your account</h2>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px',
              color: 'var(--red)', fontSize: '13px', marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="input-label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="input-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: '8px', width: '100%', padding: '10px' }}
            >
              {loading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Need an account?{' '}
            <a href="/register" style={{ color: 'var(--accent)' }}>Register here</a>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Demo: admin@procurehub.in / admin123
        </p>
      </div>
    </div>
  )
}
