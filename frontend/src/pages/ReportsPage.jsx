import { useEffect, useState } from 'react'
import { reportsApi } from '../api/client'
import { BarChart2, TrendingUp, PieChart, Package, Users, FileText } from 'lucide-react'

const fmt = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'
const fmtL = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${fmt(n)}`

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const BAR_COLORS = ['var(--accent)', 'var(--blue)', 'var(--purple)', 'var(--amber)', 'var(--green)', 'var(--red)', 'var(--orange)']

function BarChart({ data, keyField, valueField, label, color = 'var(--accent)' }) {
  if (!data?.length) return <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No data</div>
  const max = Math.max(...data.map(d => d[valueField] || 0))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 120, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d[keyField]}>{d[keyField]}</div>
          <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 4, height: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${max > 0 ? (d[valueField] / max) * 100 : 0}%`, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 4, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ width: 90, fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-mono)', flexShrink: 0, textAlign: 'right' }}>{label === 'money' ? fmtL(d[valueField]) : fmt(d[valueField])}</div>
        </div>
      ))}
    </div>
  )
}

function PieDonut({ data }) {
  if (!data?.length) return <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No data</div>
  const total = data.reduce((s, d) => s + d.count, 0)
  const colors = { draft: 'var(--text-muted)', submitted: 'var(--blue)', under_review: 'var(--purple)', approved: 'var(--green)', rejected: 'var(--red)', po_created: 'var(--accent)' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[d.status] || BAR_COLORS[i % BAR_COLORS.length], flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{d.status.replace(/_/g, ' ')}</div>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{d.count}</div>
          <div style={{ width: 50, fontSize: 11, color: 'var(--text-muted)' }}>{total > 0 ? ((d.count / total) * 100).toFixed(0) : 0}%</div>
        </div>
      ))}
    </div>
  )
}

function MonthlyChart({ data }) {
  if (!data?.length) return <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No data</div>
  const max = Math.max(...data.map(d => d.total || 0))
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 140, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{fmtL(d.total)}</div>
          <div style={{ width: '100%', background: 'var(--bg-elevated)', borderRadius: 4, height: 100, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${max > 0 ? (d.total / max) * 100 : 0}%`,
              background: 'var(--accent)',
              borderRadius: 4,
              transition: 'height 0.5s ease',
              minHeight: d.total > 0 ? 4 : 0,
            }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{MONTHS[(d.month - 1) % 12]}</div>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [stats, setStats] = useState(null)
  const [vendorSpend, setVendorSpend] = useState([])
  const [deptSpend, setDeptSpend] = useState([])
  const [monthlySpend, setMonthlySpend] = useState([])
  const [prStatus, setPrStatus] = useState([])
  const [topItems, setTopItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      reportsApi.dashboard(),
      reportsApi.spendByVendor(),
      reportsApi.spendByDept(),
      reportsApi.monthlySpend(),
      reportsApi.prStatusBreakdown(),
      reportsApi.topItems(),
    ]).then(([s, v, d, m, p, t]) => {
      setStats(s.data)
      setVendorSpend(v.data)
      setDeptSpend(d.data)
      setMonthlySpend(m.data)
      setPrStatus(p.data)
      setTopItems(t.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Procurement insights and spend analysis</p>
        </div>
      </div>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total PRs', value: stats.total_prs, icon: FileText, color: 'var(--blue)' },
            { label: 'Pending Approval', value: stats.pending_approval, icon: FileText, color: 'var(--amber)' },
            { label: 'Total POs', value: stats.total_pos, icon: Package, color: 'var(--accent)' },
            { label: 'Active POs', value: stats.active_pos, icon: Package, color: 'var(--green)' },
            { label: 'Total PO Value', value: fmtL(stats.total_po_value), icon: TrendingUp, color: 'var(--purple)' },
            { label: 'Approved Vendors', value: stats.approved_vendors, icon: Users, color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span className="stat-label">{s.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={14} style={{ color: s.color }} />
                </div>
              </div>
              <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            <BarChart2 size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Monthly PO Spend
          </h3>
          <MonthlyChart data={monthlySpend} />
        </div>
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            <PieChart size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />PR Status Breakdown
          </h3>
          <PieDonut data={prStatus} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            <TrendingUp size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Top Vendors by Spend
          </h3>
          <BarChart data={vendorSpend} keyField="vendor" valueField="total_spend" label="money" />
        </div>
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            <BarChart2 size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Spend by Department
          </h3>
          <BarChart data={deptSpend} keyField="department" valueField="total_value" label="money" />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          <Package size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Top Purchased Items
        </h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>#</th><th>Item Name</th><th>Total Quantity</th><th>Total Spend</th></tr>
            </thead>
            <tbody>
              {topItems.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No data yet</td></tr>
              ) : topItems.map((item, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{item.item}</td>
                  <td>{fmt(item.total_qty)}</td>
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtL(item.total_spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
