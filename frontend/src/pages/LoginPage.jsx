import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
      minHeight: '100vh',
      background: '#354a5e',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Shell-like header */}
      <div style={{
        height: 44, background: '#1d2d3e',
        borderBottom: '1px solid #253547',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10,
      }}>
        <div style={{
          width: 24, height: 24, background: '#0a6ed1', borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 12, color: '#fff',
        }}>P</div>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
          ProcureHub
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
          Enterprise Procurement Management
        </span>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Login card */}
          <div style={{
            background: '#ffffff', border: '1px solid #d9d9d9',
            borderRadius: 4, overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          }}>
            {/* Card header */}
            <div style={{
              padding: '14px 20px', background: '#f5f5f5',
              borderBottom: '1px solid #d9d9d9',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#32363a', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                Sign In
              </div>
              <div style={{ fontSize: 11, color: '#6a6d70', marginTop: 2, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                Use your company credentials to access ProcureHub
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding: '20px' }}>
              {error && (
                <div style={{
                  background: '#fff1f1', border: '1px solid #f9b4b4',
                  borderRadius: 4, padding: '8px 12px',
                  color: '#bb0000', fontSize: 12, marginBottom: 14,
                  fontFamily: 'Segoe UI, Arial, sans-serif',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 600,
                    color: '#32363a', marginBottom: 4,
                    fontFamily: 'Segoe UI, Arial, sans-serif',
                  }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoFocus
                    style={{
                      width: '100%', padding: '6px 10px',
                      border: '1px solid #d9d9d9', borderRadius: 4,
                      fontSize: 13, color: '#32363a',
                      fontFamily: 'Segoe UI, Arial, sans-serif',
                      outline: 'none', background: '#fff',
                    }}
                    onFocus={e => e.target.style.borderColor = '#0a6ed1'}
                    onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 600,
                    color: '#32363a', marginBottom: 4,
                    fontFamily: 'Segoe UI, Arial, sans-serif',
                  }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '6px 10px',
                      border: '1px solid #d9d9d9', borderRadius: 4,
                      fontSize: 13, color: '#32363a',
                      fontFamily: 'Segoe UI, Arial, sans-serif',
                      outline: 'none', background: '#fff',
                    }}
                    onFocus={e => e.target.style.borderColor = '#0a6ed1'}
                    onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '8px',
                    background: loading ? '#5a9fd4' : '#0a6ed1',
                    color: '#fff', border: 'none', borderRadius: 4,
                    fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Segoe UI, Arial, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#fff', borderRadius: '50%',
                        display: 'inline-block', animation: 'spin 0.6s linear infinite',
                      }} />
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </button>
              </form>

              <p style={{
                textAlign: 'center', marginTop: 14, fontSize: 12,
                color: '#6a6d70', fontFamily: 'Segoe UI, Arial, sans-serif',
              }}>
                New user?{' '}
                <Link to="/register" style={{ color: '#0a6ed1' }}>Register here</Link>
              </p>
            </div>
          </div>

          {/* Demo info */}
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'rgba(255,255,255,0.08)', borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: 11, color: 'rgba(255,255,255,0.7)',
            fontFamily: 'Segoe UI, Arial, sans-serif',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'rgba(255,255,255,0.9)' }}>Demo Credentials</div>
            <div>Admin: admin@procurehub.in / admin123</div>
            <div>Buyer: buyer@procurehub.in / buyer123</div>
          </div>
        </div>
      </div>

      <div style={{
        padding: '10px 20px', textAlign: 'center',
        fontSize: 11, color: 'rgba(255,255,255,0.4)',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        © 2026 ProcureHub · Enterprise Procurement Management System · v2.0
      </div>
    </div>
  )
}
