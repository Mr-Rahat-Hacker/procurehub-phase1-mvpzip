import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { prApi } from '../api/client'
import useToastStore from '../store/toastStore'
import useAuthStore from '../store/authStore'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

const DEPARTMENTS = ['Engineering', 'Manufacturing', 'IT', 'HR', 'Finance', 'Operations', 'R&D', 'Quality', 'Logistics', 'Admin']
const UOM = ['EA', 'KG', 'LTR', 'MTR', 'NOS', 'SET', 'BOX', 'PCS', 'TON', 'KM']

const emptyItem = () => ({ item_code: '', item_name: '', description: '', quantity: 1, unit_of_measure: 'EA', estimated_unit_price: 0, category: '' })

export default function NewPRPage() {
  const toast = useToastStore()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    title: '', description: '', department: user?.department || '',
    priority: 'medium', required_by: '',
  })
  const [items, setItems] = useState([emptyItem()])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setItem = (i, k, v) => setItems(items => items.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const addItem = () => setItems(it => [...it, emptyItem()])
  const removeItem = (i) => setItems(it => it.filter((_, idx) => idx !== i))

  const totalValue = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.estimated_unit_price) || 0), 0)

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.department) e.department = 'Department is required'
    if (items.some(it => !it.item_name.trim())) e.items = 'All line items must have a name'
    if (items.some(it => parseFloat(it.quantity) <= 0 || isNaN(parseFloat(it.quantity)))) e.items = 'All quantities must be greater than 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (submitAfter = false) => {
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        ...form,
        required_by: form.required_by ? new Date(form.required_by).toISOString() : null,
        line_items: items.map(it => ({
          ...it,
          quantity: parseFloat(it.quantity),
          estimated_unit_price: parseFloat(it.estimated_unit_price),
        })),
      }
      const res = await prApi.create(payload)
      if (submitAfter) await prApi.submit(res.data.id)
      toast.success(submitAfter ? 'PR created and submitted' : 'PR saved as draft')
      navigate('/requisitions')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create PR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '860px' }}>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost" onClick={() => navigate('/requisitions')} style={{ marginBottom: '8px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={14} /> Back to Requisitions
          </button>
          <h1 className="page-title">New Purchase Requisition</h1>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Basic Information</h3>
        <div className="form-group">
          <label className="input-label">Title *</label>
          <input className="input" placeholder="e.g. CNC Machine Spare Parts - Q1" value={form.title} onChange={e => setField('title', e.target.value)} />
          {errors.title && <p className="form-error">{errors.title}</p>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="input-label">Department *</label>
            <select className="input" value={form.department} onChange={e => setField('department', e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            {errors.department && <p className="form-error">{errors.department}</p>}
          </div>
          <div className="form-group">
            <label className="input-label">Priority</label>
            <select className="input" value={form.priority} onChange={e => setField('priority', e.target.value)}>
              {['low', 'medium', 'high', 'critical'].map(p => <option key={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="input-label">Required By</label>
            <input className="input" type="date" value={form.required_by} onChange={e => setField('required_by', e.target.value)} />
          </div>
          <div className="form-group" />
        </div>
        <div className="form-group">
          <label className="input-label">Description / Justification</label>
          <textarea className="input" rows={3} placeholder="Business justification for this purchase..." value={form.description} onChange={e => setField('description', e.target.value)} />
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
                <th style={{ minWidth: '80px' }}>Item Code</th>
                <th style={{ minWidth: '160px' }}>Item Name *</th>
                <th style={{ minWidth: '70px' }}>Qty</th>
                <th style={{ minWidth: '70px' }}>UOM</th>
                <th style={{ minWidth: '110px' }}>Unit Price (₹)</th>
                <th style={{ minWidth: '100px' }}>Total</th>
                <th style={{ width: '36px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const total = (parseFloat(it.quantity) || 0) * (parseFloat(it.estimated_unit_price) || 0)
                return (
                  <tr key={i}>
                    <td><input className="input" value={it.item_code} onChange={e => setItem(i, 'item_code', e.target.value)} placeholder="SKU" /></td>
                    <td><input className="input" value={it.item_name} onChange={e => setItem(i, 'item_name', e.target.value)} placeholder="Item name" /></td>
                    <td><input className="input" type="number" min="0.01" step="0.01" value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} /></td>
                    <td>
                      <select className="input" value={it.unit_of_measure} onChange={e => setItem(i, 'unit_of_measure', e.target.value)}>
                        {UOM.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td><input className="input" type="number" min="0" step="0.01" value={it.estimated_unit_price} onChange={e => setItem(i, 'estimated_unit_price', e.target.value)} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-accent)' }}>
                      ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Estimated Total:</span>
          <span className="mono" style={{ fontSize: '18px', fontWeight: 500, color: 'var(--accent)' }}>
            ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/requisitions')}>Cancel</button>
        <button className="btn btn-secondary" onClick={() => handleSubmit(false)} disabled={loading}>Save as Draft</button>
        <button className="btn btn-primary" onClick={() => handleSubmit(true)} disabled={loading}>
          {loading ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Submit for Approval'}
        </button>
      </div>
    </div>
  )
}
