import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { poApi } from '../api/client'
import useToastStore from '../store/toastStore'
import { ArrowLeft, Send, CheckCircle, Package } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_BADGE = {
  draft: 'badge-muted', sent: 'badge-blue', acknowledged: 'badge-purple',
  partially_received: 'badge-amber', fully_received: 'badge-green',
  cancelled: 'badge-red', closed: 'badge-muted',
}

const NEXT_ACTIONS = {
  draft: { label: 'Send to Vendor', next: 'sent', icon: Send },
  sent: { label: 'Mark Acknowledged', next: 'acknowledged', icon: CheckCircle },
  acknowledged: { label: 'Mark Partially Received', next: 'partially_received', icon: Package },
  partially_received: { label: 'Mark Fully Received', next: 'fully_received', icon: CheckCircle },
  fully_received: { label: 'Close PO', next: 'closed', icon: CheckCircle },
}

export default function PODetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToastStore()
  const [po, setPO] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const fetchPO = async () => {
    try {
      const res = await poApi.get(id)
      setPO(res.data)
    } catch {
      toast.error('PO not found')
      navigate('/purchase-orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPO() }, [id])

  const advance = async () => {
    const action = NEXT_ACTIONS[po.status]
    if (!action) return
    setActing(true)
    try {
      await poApi.update(po.id, { status: action.next })
      toast.success(`PO marked as ${action.next.replace(/_/g, ' ')}`)
      fetchPO()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Update failed')
    } finally {
      setActing(false)
    }
  }

  const cancel = async () => {
    if (!confirm('Cancel this purchase order?')) return
    setActing(true)
    try {
      await poApi.update(po.id, { status: 'cancelled' })
      toast.success('PO cancelled')
      fetchPO()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Cancel failed')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!po) return null

  const nextAction = NEXT_ACTIONS[po.status]

  return (
    <div style={{ maxWidth: '900px' }}>
      <button className="btn btn-ghost" onClick={() => navigate('/purchase-orders')}
        style={{ marginBottom: '16px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <ArrowLeft size={14} /> Back to Purchase Orders
      </button>

      <div className="page-header">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{po.po_number}</div>
          <h1 className="page-title">{po.vendor?.company_name || `Vendor #${po.vendor_id}`}</h1>
          {po.vendor && <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{po.vendor.vendor_code}</p>}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`badge ${STATUS_BADGE[po.status]}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
            {po.status.replace(/_/g, ' ')}
          </span>
          {nextAction && (
            <button className="btn btn-primary btn-sm" disabled={acting} onClick={advance}>
              <nextAction.icon size={13} /> {nextAction.label}
            </button>
          )}
          {['draft', 'sent', 'acknowledged'].includes(po.status) && (
            <button className="btn btn-danger btn-sm" disabled={acting} onClick={cancel}>Cancel PO</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="card">
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Order Details</h3>
          <InfoRow label="PO Number" value={po.po_number} mono />
          <InfoRow label="Payment Terms" value={po.payment_terms} mono />
          <InfoRow label="Currency" value={po.currency} />
          <InfoRow label="Expected Delivery" value={po.expected_delivery ? format(new Date(po.expected_delivery), 'dd MMM yyyy') : '—'} />
          <InfoRow label="Created By" value={po.created_by || '—'} />
          <InfoRow label="Created At" value={format(new Date(po.created_at), 'dd MMM yyyy, HH:mm')} />
        </div>
        <div className="card">
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Financials</h3>
          <InfoRow label="Subtotal" value={`₹${po.subtotal?.toLocaleString('en-IN')}`} mono />
          <InfoRow label="GST / Tax" value={`₹${po.tax_amount?.toLocaleString('en-IN')}`} mono />
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '15px', fontWeight: 500 }}>
            <span>Total</span>
            <span className="mono" style={{ color: 'var(--accent)' }}>₹{po.total_amount?.toLocaleString('en-IN')}</span>
          </div>
          {po.notes && (
            <>
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '12px 0' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Notes</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{po.notes}</p>
            </>
          )}
        </div>
      </div>

      {po.delivery_address && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Delivery Address</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{po.delivery_address}</p>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          Line Items ({po.line_items?.length || 0})
        </h3>
        <div className="table-wrap" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>UOM</th>
                <th>Unit Price</th>
                <th>GST %</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {po.line_items?.map(li => (
                <tr key={li.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{li.item_name}</div>
                    {li.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{li.description}</div>}
                  </td>
                  <td><span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{li.hsn_code || '—'}</span></td>
                  <td><span className="mono">{li.quantity}</span></td>
                  <td>{li.unit_of_measure}</td>
                  <td><span className="mono">₹{li.unit_price?.toLocaleString('en-IN')}</span></td>
                  <td><span className="mono">{li.tax_rate}%</span></td>
                  <td><span className="mono" style={{ color: 'var(--accent)', fontWeight: 500 }}>₹{li.total_price?.toLocaleString('en-IN')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
