import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { prApi } from '../api/client'
import useToastStore from '../store/toastStore'
import useAuthStore from '../store/authStore'
import { ArrowLeft, Send, CheckCircle, XCircle, ShoppingCart, Printer, FileSearch } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_BADGE = {
  draft: 'badge-muted', submitted: 'badge-blue', under_review: 'badge-purple',
  approved: 'badge-green', rejected: 'badge-red', po_created: 'badge-accent',
}
const PRIORITY_BADGE = { low: 'badge-muted', medium: 'badge-blue', high: 'badge-amber', critical: 'badge-red' }
const APPROVER_ROLES = ['admin', 'procurement_manager', 'approver']

export default function PRDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToastStore()
  const { user } = useAuthStore()
  const [pr, setPR] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const fetchPR = async () => {
    try {
      const res = await prApi.get(id)
      setPR(res.data)
    } catch {
      toast.error('PR not found')
      navigate('/requisitions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPR() }, [id])

  const act = async (fn, successMsg) => {
    setActing(true)
    try {
      await fn()
      toast.success(successMsg)
      fetchPR()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Action failed')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!pr) return null

  const isOwner = pr.requester_id === user?.id
  const isApprover = APPROVER_ROLES.includes(user?.role)

  return (
    <div style={{ maxWidth: '860px' }}>
      <button className="btn btn-ghost" onClick={() => navigate('/requisitions')}
        style={{ marginBottom: '16px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <ArrowLeft size={14} /> Back to Requisitions
      </button>

      <div className="page-header">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{pr.pr_number}</div>
          <h1 className="page-title">{pr.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`badge ${STATUS_BADGE[pr.status]}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
            {pr.status.replace(/_/g, ' ')}
          </span>
          {pr.status === 'draft' && isOwner && (
            <button className="btn btn-secondary btn-sm" disabled={acting}
              onClick={() => act(() => prApi.submit(pr.id), 'PR submitted for approval')}>
              <Send size={13} /> Submit
            </button>
          )}
          {pr.status === 'submitted' && isApprover && (
            <>
              <button className="btn btn-sm" style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}
                disabled={acting}
                onClick={() => act(() => prApi.update(pr.id, { status: 'approved' }), 'PR approved')}>
                <CheckCircle size={13} /> Approve
              </button>
              <button className="btn btn-danger btn-sm" disabled={acting}
                onClick={() => act(() => prApi.update(pr.id, { status: 'rejected' }), 'PR rejected')}>
                <XCircle size={13} /> Reject
              </button>
            </>
          )}
          {pr.status === 'approved' && (
            <>
              <Link to={`/purchase-orders/new?pr=${pr.id}`} className="btn btn-primary btn-sm">
                <ShoppingCart size={13} /> Create PO
              </Link>
              <Link to={`/rfqs/new?pr_id=${pr.id}`} className="btn btn-secondary btn-sm">
                <FileSearch size={13} /> Create RFQ
              </Link>
            </>
          )}
          <Link to={`/print/pr/${pr.id}`} target="_blank" className="btn btn-secondary btn-sm">
            <Printer size={13} /> Print
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="card">
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Details</h3>
          <InfoRow label="Department" value={pr.department} />
          <InfoRow label="Priority">
            <span className={`badge ${PRIORITY_BADGE[pr.priority]}`} style={{ textTransform: 'capitalize' }}>{pr.priority}</span>
          </InfoRow>
          <InfoRow label="Required By" value={pr.required_by ? format(new Date(pr.required_by), 'dd MMM yyyy') : '—'} />
          <InfoRow label="Est. Value" value={`₹${pr.estimated_value?.toLocaleString('en-IN')}`} mono />
          <InfoRow label="Created" value={format(new Date(pr.created_at), 'dd MMM yyyy, HH:mm')} />
        </div>
        <div className="card">
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Approval</h3>
          <InfoRow label="Approved By" value={pr.approved_by || '—'} />
          <InfoRow label="Notes" value={pr.approval_notes || '—'} />
          {pr.description && (
            <>
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '12px 0' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Justification</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{pr.description}</p>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          Line Items ({pr.line_items?.length || 0})
        </h3>
        <div className="table-wrap" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Qty</th>
                <th>UOM</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {pr.line_items?.map(li => (
                <tr key={li.id}>
                  <td><span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{li.item_code || '—'}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{li.item_name}</div>
                    {li.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{li.description}</div>}
                  </td>
                  <td><span className="mono">{li.quantity}</span></td>
                  <td>{li.unit_of_measure}</td>
                  <td><span className="mono">₹{li.estimated_unit_price?.toLocaleString('en-IN')}</span></td>
                  <td><span className="mono" style={{ color: 'var(--accent)', fontWeight: 500 }}>₹{li.total_price?.toLocaleString('en-IN')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Estimated Total:</span>
          <span className="mono" style={{ fontSize: '18px', fontWeight: 500, color: 'var(--accent)' }}>
            ₹{pr.estimated_value?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      {children || <span className={mono ? 'mono' : ''} style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>}
    </div>
  )
}
