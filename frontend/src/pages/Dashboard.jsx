import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { prApi, poApi, vendorApi } from '../api/client'
import useAuthStore from '../store/authStore'
import { FileText, Users, ShoppingCart, TrendingUp, Plus, ArrowRight, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

const STATUS_BADGE = {
  draft: 'badge-muted', submitted: 'badge-blue', approved: 'badge-green',
  rejected: 'badge-red', po_created: 'badge-accent', under_review: 'badge-blue',
  pending: 'badge-amber', sent: 'badge-blue', acknowledged: 'badge-accent',
  partially_received: 'badge-amber', fully_received: 'badge-green', closed: 'badge-muted', cancelled: 'badge-red',
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

  const totalPOValue = data.pos.reduce((s, p) => s + (p.total_amount || 0), 0)
  const activePOs = data.pos.filter(p => ['sent', 'acknowledged', 'partially_received'].includes(p.status))
  const pendingApprovals = data.prs.filter(p => p.status === 'submitted')
  const approvedVendors = data.vendors.filter(v => v.status === 'approved')

  const kpis = [
    { label: 'Total Requisitions', value: data.prs.length, color: '#0854a0', icon: FileText },
    { label: 'Pending Approvals', value: pendingApprovals.length, color: pendingApprovals.length > 0 ? '#e9730c' : '#107e3e', icon: Clock },
    { label: 'Active POs', value: activePOs.length, color: '#0a6ed1', icon: ShoppingCart },
    { label: 'Approved Vendors', value: approvedVendors.length, color: '#107e3e', icon: CheckCircle },
    { label: 'Total PO Value', value: `₹${(totalPOValue / 100000).toFixed(2)}L`, color: '#6a1a75', icon: TrendingUp },
    { label: 'Pending Vendors', value: data.vendors.filter(v => v.status === 'pending').length, color: '#e9730c', icon: Users },
  ]

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome, {user?.full_name} &nbsp;·&nbsp;
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/requisitions/new" className="btn btn-secondary btn-sm">
            <Plus size={13} /> New PR
          </Link>
          <Link to="/purchase-orders/new" className="btn btn-primary btn-sm">
            <Plus size={13} /> New PO
          </Link>
        </div>
      </div>

      {/* Pending Approval Banner */}
      {pendingApprovals.length > 0 && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} />
            <strong>{pendingApprovals.length}</strong> purchase requisition{pendingApprovals.length > 1 ? 's' : ''} awaiting approval
          </span>
          <Link to="/requisitions" style={{ fontSize: 12, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            Review <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        {kpis.map((k) => (
          <div key={k.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="stat-label">{k.label}</span>
              <k.icon size={14} style={{ color: k.color, opacity: 0.8, flexShrink: 0 }} />
            </div>
            <div className="stat-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tables row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Recent PRs */}
        <div className="panel">
          <div className="panel-header">
            <span>Recent Purchase Requisitions</span>
            <Link to="/requisitions" style={{ fontSize: 11, color: 'var(--text-link)', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={11} />
            </Link>
          </div>
          <table className="table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th style={{ borderTop: 'none' }}>PR No.</th>
                <th style={{ borderTop: 'none' }}>Title</th>
                <th style={{ borderTop: 'none' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.prs.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No requisitions yet</td></tr>
              ) : data.prs.slice(0, 6).map((pr) => (
                <tr key={pr.id}>
                  <td>
                    <Link to={`/requisitions/${pr.id}`} style={{ color: 'var(--text-link)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {pr.pr_number}
                    </Link>
                  </td>
                  <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pr.title}
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[pr.status] || 'badge-muted'}`}>{pr.status.replace(/_/g, ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent POs */}
        <div className="panel">
          <div className="panel-header">
            <span>Recent Purchase Orders</span>
            <Link to="/purchase-orders" style={{ fontSize: 11, color: 'var(--text-link)', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={11} />
            </Link>
          </div>
          <table className="table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th style={{ borderTop: 'none' }}>PO No.</th>
                <th style={{ borderTop: 'none' }}>Vendor</th>
                <th style={{ borderTop: 'none' }}>Value</th>
                <th style={{ borderTop: 'none' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.pos.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No purchase orders yet</td></tr>
              ) : data.pos.slice(0, 6).map((po) => (
                <tr key={po.id}>
                  <td>
                    <Link to={`/purchase-orders/${po.id}`} style={{ color: 'var(--text-link)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {po.po_number}
                    </Link>
                  </td>
                  <td style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
                    {po.vendor?.company_name || '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, whiteSpace: 'nowrap' }}>
                    ₹{po.total_amount?.toLocaleString('en-IN')}
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[po.status] || 'badge-muted'}`}>{po.status.replace(/_/g, ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Pipeline */}
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="panel-header">
          <span>Vendor Pipeline</span>
          <Link to="/vendors" style={{ fontSize: 11, color: 'var(--text-link)', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <ArrowRight size={11} />
          </Link>
        </div>
        <table className="table" style={{ border: 'none' }}>
          <thead>
            <tr>
              <th>Vendor Code</th>
              <th>Company Name</th>
              <th>Category</th>
              <th>Contact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.vendors.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No vendors yet</td></tr>
            ) : data.vendors.filter(v => v.status !== 'approved').concat(data.vendors.filter(v => v.status === 'approved')).slice(0, 5).map((v) => (
              <tr key={v.id}>
                <td><Link to={`/vendors/${v.id}`} style={{ color: 'var(--text-link)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{v.vendor_code}</Link></td>
                <td style={{ fontWeight: 500, fontSize: 12 }}>{v.company_name}</td>
                <td style={{ textTransform: 'capitalize', fontSize: 11 }}>{v.category?.replace(/_/g, ' ')}</td>
                <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v.contact_email}</td>
                <td><span className={`badge ${STATUS_BADGE[v.status] || 'badge-muted'}`}>{v.status.replace(/_/g, ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
