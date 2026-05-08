import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { rfqApi, vendorApi, prApi } from '../api/client'
import useAuthStore from '../store/authStore'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

const emptyItem = () => ({ item_name: '', description: '', quantity: 1, unit_of_measure: 'EA', category: '', target_price: '' })

export default function NewRFQPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const prId = params.get('pr_id')
  const { user } = useAuthStore()

  const [form, setForm] = useState({
    title: '', description: '', department: user?.department || '',
    requisition_id: prId ? parseInt(prId) : null,
    submission_deadline: '', delivery_terms: '', payment_terms: 'NET30',
    special_instructions: '', vendor_ids: [],
  })
  const [items, setItems] = useState([emptyItem()])
  const [vendors, setVendors] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    vendorApi.list({ status: 'approved', limit: 100 }).then(r => setVendors(r.data))
    if (prId) {
      prApi.get(prId).then(r => {
        const pr = r.data
        setForm(f => ({ ...f, title: `RFQ for ${pr.title}`, department: pr.department }))
        setItems(pr.line_items.map(li => ({
          item_name: li.item_name, description: li.description || '',
          quantity: li.quantity, unit_of_measure: li.unit_of_measure,
          category: li.category || '', target_price: li.estimated_unit_price || '',
        })))
      })
    }
  }, [prId])

  const setItem = (i, field, val) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const toggleVendor = (id) => setForm(f => ({
    ...f, vendor_ids: f.vendor_ids.includes(id) ? f.vendor_ids.filter(v => v !== id) : [...f.vendor_ids, id]
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!items.some(it => it.item_name)) { setError('Add at least one item'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        requisition_id: form.requisition_id || null,
        submission_deadline: form.submission_deadline || null,
        line_items: items.filter(it => it.item_name).map(it => ({
          ...it,
          quantity: parseFloat(it.quantity) || 1,
          target_price: it.target_price ? parseFloat(it.target_price) : null,
        })),
      }
      const res = await rfqApi.create(payload)
      navigate(`/rfqs/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create RFQ')
      setSaving(false)
    }
  }

  const dept = ['Production', 'Maintenance', 'Quality', 'Stores', 'Admin', 'IT', 'HR', 'Finance', 'Engineering']

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="page-title">New Request for Quotation</h1>
          <p className="page-subtitle">Send to multiple suppliers to compare prices</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>RFQ Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Title *</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="RFQ title" />
            </div>
            <div className="form-group">
              <label className="input-label">Department *</label>
              <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} required>
                <option value="">Select department</option>
                {dept.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Submission Deadline</label>
              <input type="datetime-local" className="input" value={form.submission_deadline} onChange={e => setForm(f => ({ ...f, submission_deadline: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="input-label">Payment Terms</label>
              <select className="input" value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))}>
                {['NET30', 'NET45', 'NET60', 'ADVANCE', 'COD'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Scope and requirements..." />
          </div>
          <div className="form-group">
            <label className="input-label">Special Instructions</label>
            <textarea className="input" rows={2} value={form.special_instructions} onChange={e => setForm(f => ({ ...f, special_instructions: e.target.value }))} placeholder="Packaging, delivery, quality standards..." />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 500 }}>Line Items</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13} /> Add Item</button>
          </div>
          <div className="table-wrap">
            <table className="line-items-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Item Name *</th>
                  <th style={{ width: '15%' }}>Qty</th>
                  <th style={{ width: '10%' }}>UOM</th>
                  <th style={{ width: '15%' }}>Category</th>
                  <th style={{ width: '15%' }}>Target Price</th>
                  <th style={{ width: '20%' }}>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td><input className="input" value={item.item_name} onChange={e => setItem(i, 'item_name', e.target.value)} placeholder="Item name" required /></td>
                    <td><input className="input" type="number" min="0.01" step="any" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} /></td>
                    <td>
                      <select className="input" value={item.unit_of_measure} onChange={e => setItem(i, 'unit_of_measure', e.target.value)}>
                        {['EA', 'KG', 'LTR', 'MTR', 'NOS', 'SET', 'BOX', 'PKT'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td><input className="input" value={item.category} onChange={e => setItem(i, 'category', e.target.value)} placeholder="Category" /></td>
                    <td><input className="input" type="number" min="0" step="any" value={item.target_price} onChange={e => setItem(i, 'target_price', e.target.value)} placeholder="₹ target" /></td>
                    <td><input className="input" value={item.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Specs..." /></td>
                    <td>
                      {items.length > 1 && (
                        <button type="button" className="btn-ghost" onClick={() => removeItem(i)} style={{ color: 'var(--red)', padding: 4 }}><Trash2 size={13} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Invite Vendors</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Select approved vendors to receive this RFQ</p>
          {vendors.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No approved vendors available. Approve vendors first.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {vendors.map(v => (
                <label key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  border: `1px solid ${form.vendor_ids.includes(v.id) ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: form.vendor_ids.includes(v.id) ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  transition: 'all 150ms',
                }}>
                  <input type="checkbox" checked={form.vendor_ids.includes(v.id)} onChange={() => toggleVendor(v.id)} style={{ accentColor: 'var(--accent)' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v.company_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.vendor_code} · {v.category || 'General'}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create RFQ'}
          </button>
        </div>
      </form>
    </div>
  )
}
