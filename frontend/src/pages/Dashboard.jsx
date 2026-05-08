import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { prApi, poApi, vendorApi } from '../api/client'
import useAuthStore from '../store/authStore'
import { FileText, Users, ShoppingCart, TrendingUp, Plus, ArrowRight } from 'lucide-react'

const statusBadge = {
  draft: 'badge-muted', submitted: 'badge-blue', approved: 'badge-green',
  rejected: 'badge-red', po_created: 'badge-accent',
  pending: 'badge-amber', under_review: 'badge-blue',
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState({ prs: [], pos: [], vendors: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      prApi.list({ limit: 100 }),
      poApi.list({ limit: 100 }),
      vendorApi.list({ limit: 100 }),
    ]).then(([prs, pos, vendors]) => {
      setData({ prs: prs.data, pos: pos.data, vendors: vendors.data })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total PRs', value: data.prs.length, icon: FileText, color: 'var(--blue)', bg: 'var(--blue-dim)' },
    {
      label: 'Active POs',
      value: data.pos.filter(p => ['sent', 'acknowledged', 'partially_received'].includes(p.status)).length,
      icon: ShoppingCart, color: 'var(--accent)', bg: 'var(--accent-dim)'
    },
    { label: 'Vendors', value: data.vendors.filter(v => v.status === 'approved').length, icon: Users, color: 'var(--purple)', bg: 'var(--purple-dim)' },
    {
      label: 'PO Value (INR)',
      value: '₹' + (data.pos.reduce((s, p) => s + (p.total_amount || 0), 0) / 100000).toFixed(1) + 'L',
      icon: TrendingUp, color: 'var(--green)', bg: 'var(--green-dim)',
    },
  ]

  const pendingApprovals = data.prs.filter(p => p.status === 'submitted').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's your procurement overview</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/requisitions/new" className="btn btn-secondary btn-sm">
            <Plus size={14} /> New PR
          </Link>
          <Link to="/purchase-orders/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> New PO
          </Link>
        </div>
      </div>

      {pendingApprovals > 0 && (
        <div style={{
          background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', fontSize: '13px',
        }}>
          <span>🔔 <strong>{pendingApprovals}</strong> purchase requisition{pendingApprovals > 1 ? 's' : ''} pending approval</span>
          <Link to="/requisitions?status=submitted" style={{ color: 'var(--amber)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Review <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="stat-label">{s.label}</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={16} color={s.color} />
                  </div>
                </div>
                <div className="stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 500 }}>Recent Requisitions</h3>
                <Link to="/requisitions" style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {data.prs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No requisitions yet</p>
              ) : (
                data.prs.slice(0, 5).map((pr) => (
                  <Link key={pr.id} to={`/requisitions/${pr.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)', textDecoration: 'none', fontSize: '13px',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{pr.pr_number}</div>
                      <div style={{ fontWeight: 500 }}>{pr.title}</div>
                    </div>
                    <span className={`badge ${statusBadge[pr.status] || 'badge-muted'}`}>{pr.status.replace(/_/g, ' ')}</span>
                  </Link>
                ))
              )}
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 500 }}>Vendor Pipeline</h3>
                <Link to="/vendors" style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {data.vendors.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No vendors yet</p>
              ) : (
                data.vendors.slice(0, 5).map((v) => (
                  <Link key={v.id} to={`/vendors/${v.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)', textDecoration: 'none', fontSize: '13px',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{v.vendor_code}</div>
                      <div style={{ fontWeight: 500 }}>{v.company_name}</div>
                    </div>
                    <span className={`badge ${statusBadge[v.status] || 'badge-muted'}`}>{v.status.replace(/_/g, ' ')}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
