import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { poApi, vendorApi, prApi } from '../api/client'
import useToastStore from '../store/toastStore'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

const UOM = ['EA', 'KG', 'LTR', 'MTR', 'NOS', 'SET', 'BOX', 'PCS', 'TON', 'KM']
const emptyItem = () => ({ item_name: '', description: '', quantity: 1, unit_of_measure: 'EA', unit_price: 0, hsn_code: '', tax_rate: 18 })

export default function NewPOPage() {
  const toast = useToastStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prId = searchParams.get('pr')

  const [vendors, setVendors] = useState([])
  const [form, setForm] = useState({
    vendor_id: '', payment_terms: 'NET30',
    delivery_address: '', expected_delivery: '', notes: '',
    requisition_id: prId ? parseInt(prId) : null,
  })
  const [items, setItems] = useState([emptyItem()])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    vendorApi.list({ status: 'approved' }).then(r => setVendors(r.data)).catch(() => {})
    if (prId) {
      prApi.get(prId).then(r => {
        const pr = r.data
        const mappedItems = pr.line_items.map(li => ({
          item_name: li.item_name,
          description: li.description || '',
          quantity: li.quantity,
          unit_of_measure: li.unit_of_measure,
          unit_price: li.estimated_unit_price,
          hsn_code: '',
          tax_rate: 18,
        }))
        if (mappedItems.length) setItems(mappedItems)
      }).catch(() => {})
    }
  }, [prId])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setItem = (i, k, v) => setItems(items => items.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const addItem = () => setItems(it => [...it, emptyItem()])
  const removeItem = (i) => setItems(it => it.filter((_, idx) => idx !== i))

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0), 0)
  const avgTax = items.length ? items.reduce((s, it) => s + parseFloat(it.tax_rate || 0), 0) / items.length : 18
  const taxAmount = subtotal * avgTax / 100
  const total = subtotal + taxAmount

  const validate = () => {
    const e = {}
    if (!form.vendor_id) e.vendor_id = 'Please select a vendor'
    if (items.some(it => !it.item_name.trim())) e.items = 'All line items must have a name'
    if (items.some(it => parseFloat(it.unit_price) <= 0)) e.items = 'Unit price must be greater than 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        ...form,
        vendor_id: parseInt(form.vendor_id),
        expected_delivery: form.expected_delivery ? new Date(form.expected_delivery).toISOString() : null,
        line_items: items.map(it => ({
          ...it,
          quantity: parseFloat(it.quantity),
          unit_price: parseFloat(it.unit_price),
          tax_rate: parseFloat(it.tax_rate),
        })),
      }
      await poApi.create(payload)
      toast.success('Purchase order created successfully')
      navigate('/purchase-orders')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create PO')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost" onClick={() => navigate('/purchase-orders')}
            style={{ marginBottom: '8px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={14} /> Back to Purchase Orders
          </button>
          <h1 className="page-title">New Purchase Order</h1>
          {prId && <p className="page-subtitle" style={{ color: 'var(--accent)' }}>Created from PR #{prId}</p>}
        </div>
      </div>

      {/* Header */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Details</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="input-label">Vendor *</label>
            <select className="input" value={form.vendor_id} onChange={e => setField('vendor_id', e.target.value)}>
              <option value="">Select approved vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name} ({v.vendor_code})</option>)}
            </select>
            {errors.vendor_id && <p className="form-error">{errors.vendor_id}</p>}
          </div>
          <div className="form-group">
            <label className="input-label">Payment Terms</label>
            <select className="input" value={form.payment_terms} onChange={e => setField('payment_terms', e.target.value)}>
              {['NET15', 'NET30', 'NET45', 'NET60', 'ADVANCE', 'COD'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="input-label">Expected Delivery</label>
            <input className="input" type="date" value={form.expected_delivery} onChange={e => setField('expected_delivery', e.target.value)} />
          </div>
          <div className="form-group" />
        </div>
        <div className="form-group">
          <label className="input-label">Delivery Address</label>
          <textarea className="input" rows={2} placeholder="Full delivery address..." value={form.delivery_address} onChange={e => setField('delivery_address', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="input-label">Notes / Special Instructions</label>
          <textarea className="input" rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} />
        </div>
      </div>

      {/* Line Items */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Line Items</h3>
          <button className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={12} /> Add Item</button>
        </div>
        {errors.items && <p className="form-error" style={{ marginBottom: '12px' }}>{errors.items}</p>}
        <div style={{ overflowX: 'auto' }}>
          <table className="line-items-table">
            <thead>
              <tr>
                <th style={{ minWidth: '150px' }}>Item Name *</th>
                <th style={{ minWidth: '80px' }}>HSN Code</th>
                <th style={{ minWidth: '70px' }}>Qty</th>
                <th style={{ minWidth: '70px' }}>UOM</th>
                <th style={{ minWidth: '120px' }}>Unit Price (₹) *</th>
                <th style={{ minWidth: '70px' }}>GST %</th>
                <th style={{ minWidth: '110px' }}>Total (₹)</th>
                <th style={{ width: '36px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const lineTotal = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0)
                return (
                  <tr key={i}>
                    <td><input className="input" value={it.item_name} onChange={e => setItem(i, 'item_name', e.target.value)} placeholder="Item name" /></td>
                    <td><input className="input mono" value={it.hsn_code} onChange={e => setItem(i, 'hsn_code', e.target.value)} placeholder="7318" /></td>
                    <td><input className="input" type="number" min="0.01" step="0.01" value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} /></td>
                    <td>
                      <select className="input" value={it.unit_of_measure} onChange={e => setItem(i, 'unit_of_measure', e.target.value)}>
                        {UOM.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td><input className="input" type="number" min="0" step="0.01" value={it.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} /></td>
                    <td>
                      <select className="input" value={it.tax_rate} onChange={e => setItem(i, 'tax_rate', e.target.value)}>
                        {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-accent)' }}>
                      ₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      {items.length > 1 && (
                        <button className="btn-ghost" onClick={() => removeItem(i)} style={{ color: 'var(--red)', padding: '4px' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <div style={{ minWidth: '260px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span className="mono">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>GST ({avgTax.toFixed(1)}% avg)</span>
              <span className="mono">₹{taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '10px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 500 }}>
              <span>Total</span>
              <span className="mono" style={{ color: 'var(--accent)' }}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/purchase-orders')}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Create Purchase Order'}
        </button>
      </div>
    </div>
  )
}
