import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { grnApi } from '../api/client'
import { Package, Plus } from 'lucide-react'

const statusBadge = { draft: 'badge-muted', submitted: 'badge-blue', approved: 'badge-green', rejected: 'badge-red' }

export default function GRNListPage() {
  const [grns, setGrns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    grnApi.list().then(r => { setGrns(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Goods Receipt Notes</h1>
          <p className="page-subtitle">Track received goods against Purchase Orders</p>
        </div>
        <Link to="/grns/new" className="btn btn-primary btn-sm"><Plus size={14} /> New GRN</Link>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        grns.length === 0 ? (
          <div className="empty-state">
            <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <h3>No Goods Receipt Notes</h3>
            <p>GRNs are created when goods arrive against a Purchase Order</p>
            <Link to="/grns/new" className="btn btn-primary btn-sm"><Plus size={14} /> Create GRN</Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>GRN Number</th><th>PO Number</th><th>Vendor</th><th>Delivery Note</th><th>Location</th><th>Date</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {grns.map(grn => (
                    <tr key={grn.id}>
                      <td><span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{grn.grn_number}</span></td>
                      <td><span className="mono" style={{ fontSize: 12 }}>{grn.purchase_order?.po_number}</span></td>
                      <td style={{ fontWeight: 500 }}>{grn.vendor?.company_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{grn.delivery_note_number || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{grn.warehouse_location || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{grn.received_date ? new Date(grn.received_date).toLocaleDateString('en-IN') : new Date(grn.created_at).toLocaleDateString('en-IN')}</td>
                      <td><span className={`badge ${statusBadge[grn.status] || 'badge-muted'}`}>{grn.status}</span></td>
                      <td><Link to={`/grns/${grn.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  )
}
