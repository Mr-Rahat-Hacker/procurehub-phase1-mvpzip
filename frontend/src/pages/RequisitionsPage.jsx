import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { prApi } from '../api/client'
import useToastStore from '../store/toastStore'
import useAuthStore from '../store/authStore'
import { Plus, Search, Send, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_BADGE = {
  draft: 'badge-muted', submitted: 'badge-blue', under_review: 'badge-purple',
  approved: 'badge-green', rejected: 'badge-red', po_created: 'badge-accent',
}
const PRIORITY_BADGE = { low: 'badge-muted', medium: 'badge-blue', high: 'badge-amber', critical: 'badge-red' }
const STATUSES = ['', 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'po_created']

export default function RequisitionsPage() {
  const toast = useToastStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [prs, setPRs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchPRs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await prApi.list({ status: statusFilter || undefined })
      setPRs(res.data)
    } catch { toast.error('Failed to load requisitions') }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchPRs() }, [fetchPRs])

  const handleSubmit = async (id) => {
    try {
      await prApi.submit(id)
      toast.success('PR submitted for approval')
      fetchPRs()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to submit PR')
    }
  }

  const handleApprove = async (id) => {
    try {
      await prApi.update(id, { status: 'approved' })
      toast.success('PR approved')
      fetchPRs()
    } catch { toast.error('Failed to approve PR') }
  }

  const filtered = prs.filter(p =>
    !search ||
    p.pr_number.toLowerCase().includes(search.toLowerCase()) ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.department.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Requisitions</h1>
          <p className="page-subtitle">Raise and track internal purchase requests</p>
        </div>
        <Link to="/requisitions/new" className="btn btn-primary btn-sm">
          <Plus size={14} /> New Requisition
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search PRs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
        </div>
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: '150px' }}>
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchPRs}><RefreshCw size={13} /></button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PR Number</th>
              <th>Title</th>
              <th>Department</th>
              <th>Priority</th>
              <th>Est. Value</th>
              <th>Required By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <p>No requisitions found</p>
                  <Link to="/requisitions/new" className="btn btn-primary btn-sm"><Plus size={13} /> Create First PR</Link>
                </div>
              </td></tr>
            ) : filtered.map(pr => (
              <tr key={pr.id}>
                <td><span className="mono" style={{ fontSize: '12px', color: 'var(--text-accent)' }}>{pr.pr_number}</span></td>
                <td>
                  <Link to={`/requisitions/${pr.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{pr.title}</Link>
                  {pr.line_items?.length > 0 && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pr.line_items.length} line item{pr.line_items.length > 1 ? 's' : ''}</div>}
                </td>
                <td>{pr.department}</td>
                <td><span className={`badge ${PRIORITY_BADGE[pr.priority]}`} style={{ textTransform: 'capitalize' }}>{pr.priority}</span></td>
                <td><span className="mono">₹{pr.estimated_value?.toLocaleString('en-IN')}</span></td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {pr.required_by ? format(new Date(pr.required_by), 'dd MMM yyyy') : '—'}
                </td>
                <td><span className={`badge ${STATUS_BADGE[pr.status]}`}>{pr.status.replace('_', ' ')}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {pr.status === 'draft' && (
                      <button className="btn btn-sm btn-secondary" onClick={() => handleSubmit(pr.id)}>
                        <Send size={11} /> Submit
                      </button>
                    )}
                    {pr.status === 'submitted' && ['admin', 'procurement_manager', 'approver'].includes(user?.role) && (
                      <button className="btn btn-sm" style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}
                        onClick={() => handleApprove(pr.id)}>Approve</button>
                    )}
                    {pr.status === 'approved' && (
                      <Link to={`/purchase-orders/new?pr=${pr.id}`} className="btn btn-primary btn-sm">Create PO</Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
