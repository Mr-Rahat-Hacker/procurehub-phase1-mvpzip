import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { grnApi, poApi } from '../api/client'
import { ArrowLeft } from 'lucide-react'

export default function NewGRNPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const poId = params.get('po_id')

  const [pos, setPos] = useState([])
  const [selectedPO, setSelectedPO] = useState(null)
  const [form, setForm] = useState({
    purchase_order_id: poId || '', vendor_id: '', delivery_note_number: '',
    vehicle_number: '', received_date: '', warehouse_location: '', notes: '',
  })
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    poApi.list({ status: 'sent', limit: 100 }).then(r => {
      const active = r.data.filter(p => ['sent', 'acknowledged', 'partially_received'].includes(p.status))
      setPos(active)
    })
  }, [])

  const loadPO = async (id) => {
    if (!id) { setSelectedPO(null); setItems([]); return }
    const res = await poApi.get(id)
    const po = res.data
    setSelectedPO(po)
    setForm(f => ({ ...f, vendor_id: po.vendor_id }))
    setItems(po.line_items.map(li => ({
      po_line_item_id: li.id,
      item_name: li.item_name,
      ordered_quantity: li.quantity,
      received_quantity: li.quantity,
      rejected_quantity: 0,
      unit_of_measure: li.unit_of_measure,
      batch_number: '', expiry_date: '', remarks: '',
    })))
  }

  const setItem = (i, field, val) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await grnApi.create({
        purchase_order_id: parseInt(form.purchase_order_id),
        vendor_id: parseInt(form.vendor_id),
        delivery_note_number: form.delivery_note_number || null,
        vehicle_number: form.vehicle_number || null,
        received_date: form.received_date || null,
        warehouse_location: form.warehouse_location || null,
        notes: form.notes || null,
        line_items: items.map(it => ({
          ...it,
          ordered_quantity: parseFloat(it.ordered_quantity),
          received_quantity: parseFloat(it.received_quantity),
          rejected_quantity: parseFloat(it.rejected_quantity) || 0,
          expiry_date: it.expiry_date || null,
        })),
      })
      navigate(`/grns/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create GRN')
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}><ArrowLeft size={14} /> Back</button>
          <h1 className="page-title">New Goods Receipt Note</h1>
          <p className="page-subtitle">Record goods received against a Purchase Order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Receipt Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Purchase Order *</label>
              <select className="input" value={form.purchase_order_id} onChange={e => { setForm(f => ({ ...f, purchase_order_id: e.target.value })); loadPO(e.target.value) }} required>
                <option value="">Select PO</option>
                {pos.map(po => <option key={po.id} value={po.id}>{po.po_number} — {po.vendor?.company_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Received Date</label>
              <input type="datetime-local" className="input" value={form.received_date} onChange={e => setForm(f => ({ ...f, received_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Delivery Note Number</label>
              <input className="input" value={form.delivery_note_number} onChange={e => setForm(f => ({ ...f, delivery_note_number: e.target.value }))} placeholder="Supplier's delivery note #" />
            </div>
            <div className="form-group">
              <label className="input-label">Vehicle Number</label>
              <input className="input" value={form.vehicle_number} onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value }))} placeholder="MH 01 AB 1234" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Warehouse / Store Location</label>
              <input className="input" value={form.warehouse_location} onChange={e => setForm(f => ({ ...f, warehouse_location: e.target.value }))} placeholder="e.g., Store Room A, Rack 3" />
            </div>
            <div className="form-group">
              <label className="input-label">Notes</label>
              <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any receiving notes..." />
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Items Received</h3>
            <div className="table-wrap">
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th>Item</th><th>Ordered</th><th>Received *</th><th>Rejected</th>
                    <th>UOM</th><th>Batch No.</th><th>Expiry</th><th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, fontSize: 12 }}>{item.item_name}</td>
                      <td style={{ fontSize: 12 }}>{item.ordered_quantity}</td>
                      <td><input className="input" type="number" min="0" step="any" value={item.received_quantity} onChange={e => setItem(i, 'received_quantity', e.target.value)} required /></td>
                      <td><input className="input" type="number" min="0" step="any" value={item.rejected_quantity} onChange={e => setItem(i, 'rejected_quantity', e.target.value)} /></td>
                      <td style={{ fontSize: 12 }}>{item.unit_of_measure}</td>
                      <td><input className="input" value={item.batch_number} onChange={e => setItem(i, 'batch_number', e.target.value)} placeholder="Batch" /></td>
                      <td><input type="date" className="input" value={item.expiry_date} onChange={e => setItem(i, 'expiry_date', e.target.value)} /></td>
                      <td><input className="input" value={item.remarks} onChange={e => setItem(i, 'remarks', e.target.value)} placeholder="Remarks" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || items.length === 0}>
            {saving ? 'Saving...' : 'Create GRN'}
          </button>
        </div>
      </form>
    </div>
  )
}
