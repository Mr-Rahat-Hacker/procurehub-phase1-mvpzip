import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { poApi } from '../api/client'
import useToastStore from '../store/toastStore'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_BADGE = {
  draft: 'badge-muted', sent: 'badge-blue', acknowledged: 'badge-purple',
  partially_received: 'badge-amber', fully_received: 'badge-green',
  cancelled: 'badge-red', closed: 'badge-muted',
}
const STATUSES = ['', 'draft', 'sent', 'acknowledged', 'partially_received', 'fully_received', 'cancelled', 'closed']

export default function PurchaseOrdersPage() {
  const toast = useToastStore()
  const [pos, setPOs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchPOs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await poApi.list({ status: statusFilter || undefined })
      setPOs(res.data)
    } catch { toast.error('Failed to load purchase orders') }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchPOs() }, [fetchPOs])

  const handleStatusChange = async (id, status) => {
    try {
      await poApi.update(id, { status })
      toast.success(`PO status updated to ${status}`)
      fetchPOs()
    } catch { toast.error('Failed to update PO') }
  }

  const filtered = pos.filter(p =>
    !search ||
    p.po_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Manage and track all purchase orders</p>
        </div>
        <Link to="/purchase-orders/new" className="btn btn-primary btn-sm">
          <Plus size={14} /> New PO
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search POs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
        </div>
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: '160px' }}>
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchPOs}><RefreshCw size={13} /></button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Items</th>
              <th>Subtotal</th>
              <th>Tax</th>
              <th>Total (INR)</th>
              <th>Expected Delivery</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="empty-state">
                  <div className="empty-state-icon">🛒</div>
                  <p>No purchase orders found</p>
                  <Link to="/purchase-orders/new" className="btn btn-primary btn-sm"><Plus size={13} /> Create First PO</Link>
                </div>
              </td></tr>
            ) : filtered.map(po => (
              <tr key={po.id}>
                <td><span className="mono" style={{ fontSize: '12px', color: 'var(--text-accent)' }}>{po.po_number}</span></td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Vendor #{po.vendor_id}</td>
                <td><span className={`badge ${STATUS_BADGE[po.status]}`}>{po.status.replace('_', ' ')}</span></td>
                <td style={{ fontSize: '12px' }}>{po.line_items?.length || 0} items</td>
                <td><span className="mono" style={{ fontSize: '12px' }}>₹{po.subtotal?.toLocaleString('en-IN')}</span></td>
                <td><span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>₹{po.tax_amount?.toLocaleString('en-IN')}</span></td>
                <td><span className="mono" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)' }}>₹{po.total_amount?.toLocaleString('en-IN')}</span></td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {po.expected_delivery ? format(new Date(po.expected_delivery), 'dd MMM yyyy') : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {po.status === 'draft' && (
                      <button className="btn btn-sm btn-secondary" onClick={() => handleStatusChange(po.id, 'sent')}>Send to Vendor</button>
                    )}
                    {po.status === 'sent' && (
                      <button className="btn btn-sm" style={{ background: 'var(--purple-dim)', color: 'var(--purple)', border: '1px solid rgba(167,139,250,0.2)' }}
                        onClick={() => handleStatusChange(po.id, 'acknowledged')}>Mark Acknowledged</button>
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
