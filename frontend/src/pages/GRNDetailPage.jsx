import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { grnApi } from '../api/client'
import { Printer, ArrowLeft, CheckCircle } from 'lucide-react'

const statusBadge = { draft: 'badge-muted', submitted: 'badge-blue', approved: 'badge-green', rejected: 'badge-red' }

export default function GRNDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [grn, setGrn] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    grnApi.get(id).then(r => { setGrn(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  const handleSubmit = async () => {
    await grnApi.update(id, { status: 'submitted' })
    setGrn(g => ({ ...g, status: 'submitted' }))
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!grn) return <div className="empty-state"><h3>GRN not found</h3></div>

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}><ArrowLeft size={14} /> Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">{grn.grn_number}</h1>
            <span className={`badge ${statusBadge[grn.status] || 'badge-muted'}`}>{grn.status}</span>
          </div>
          <p className="page-subtitle">Goods Receipt Note</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}><Printer size={14} /> Print</button>
          {grn.status === 'draft' && (
            <button className="btn btn-primary btn-sm" onClick={handleSubmit}><CheckCircle size={14} /> Submit GRN</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Receipt Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['PO Number', grn.purchase_order?.po_number],
              ['Vendor', grn.vendor?.company_name],
              ['Delivery Note', grn.delivery_note_number || '—'],
              ['Vehicle No.', grn.vehicle_number || '—'],
              ['Received Date', grn.received_date ? new Date(grn.received_date).toLocaleDateString('en-IN') : '—'],
              ['Warehouse', grn.warehouse_location || '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          {grn.notes && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{grn.notes}</p>
            </div>
          )}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Items</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{grn.line_items?.length || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Received</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                {grn.line_items?.reduce((s, i) => s + (i.received_quantity || 0), 0)} units
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Rejected</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>
                {grn.line_items?.reduce((s, i) => s + (i.rejected_quantity || 0), 0)} units
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Line Items</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>#</th><th>Item</th><th>Ordered</th><th>Received</th><th>Rejected</th><th>UOM</th><th>Batch</th><th>Expiry</th><th>Remarks</th></tr>
            </thead>
            <tbody>
              {grn.line_items?.map((item, i) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{item.item_name}</td>
                  <td>{item.ordered_quantity}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 500 }}>{item.received_quantity}</td>
                  <td style={{ color: item.rejected_quantity > 0 ? 'var(--red)' : 'var(--text-muted)' }}>{item.rejected_quantity}</td>
                  <td>{item.unit_of_measure}</td>
                  <td style={{ fontSize: 12 }}>{item.batch_number || '—'}</td>
                  <td style={{ fontSize: 12 }}>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
