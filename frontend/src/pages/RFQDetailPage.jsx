import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { rfqApi, vendorApi } from '../api/client'
import useAuthStore from '../store/authStore'
import { Send, Award, Printer, Plus, CheckCircle, X, ArrowLeft } from 'lucide-react'

const statusBadge = {
  draft: 'badge-muted', sent: 'badge-blue', quotes_received: 'badge-purple',
  under_evaluation: 'badge-amber', awarded: 'badge-green', cancelled: 'badge-red',
}

const fmt = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—'

export default function RFQDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [rfq, setRfq] = useState(null)
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('details')
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [vendors, setVendors] = useState([])
  const [quoteForm, setQuoteForm] = useState({ vendor_id: '', validity_days: 30, payment_terms: 'NET30', delivery_days: '', notes: '', currency: 'INR' })
  const [quoteItems, setQuoteItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [rfqRes, quotRes] = await Promise.all([rfqApi.get(id), rfqApi.getQuotations(id)])
      setRfq(rfqRes.data)
      setQuotations(quotRes.data)
      setQuoteItems((rfqRes.data.line_items || []).map(li => ({
        rfq_line_item_id: li.id, item_name: li.item_name,
        quantity: li.quantity, unit_of_measure: li.unit_of_measure,
        unit_price: '', tax_rate: 18, hsn_code: '',
      })))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { vendorApi.list({ status: 'approved', limit: 100 }).then(r => setVendors(r.data)) }, [])

  const handleSend = async () => {
    if (!window.confirm('Send RFQ to all invited vendors?')) return
    await rfqApi.send(id)
    load()
  }

  const handleAward = async (quotId) => {
    if (!window.confirm('Award this RFQ to the selected vendor?')) return
    await rfqApi.award(id, quotId)
    load()
  }

  const handleSubmitQuote = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await rfqApi.submitQuotation(id, {
        rfq_id: parseInt(id),
        vendor_id: parseInt(quoteForm.vendor_id),
        validity_days: parseInt(quoteForm.validity_days),
        payment_terms: quoteForm.payment_terms,
        delivery_days: quoteForm.delivery_days ? parseInt(quoteForm.delivery_days) : null,
        notes: quoteForm.notes,
        currency: quoteForm.currency,
        line_items: quoteItems.map(it => ({
          rfq_line_item_id: it.rfq_line_item_id,
          item_name: it.item_name,
          quantity: parseFloat(it.quantity),
          unit_of_measure: it.unit_of_measure,
          unit_price: parseFloat(it.unit_price) || 0,
          tax_rate: parseFloat(it.tax_rate) || 18,
          hsn_code: it.hsn_code || null,
        })),
      })
      setShowQuoteForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit quotation')
    } finally { setSaving(false) }
  }

  const handlePrint = () => window.print()

  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!rfq) return <div className="empty-state"><h3>RFQ not found</h3></div>

  const lowestQuote = quotations.find(q => q.is_lowest)

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}><ArrowLeft size={14} /> Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">{rfq.rfq_number}</h1>
            <span className={`badge ${statusBadge[rfq.status] || 'badge-muted'}`}>{rfq.status.replace(/_/g, ' ')}</span>
          </div>
          <p className="page-subtitle">{rfq.title}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}><Printer size={14} /> Print</button>
          {rfq.status === 'draft' && (
            <button className="btn btn-primary btn-sm" onClick={handleSend}><Send size={14} /> Send to Vendors</button>
          )}
          {rfq.status === 'sent' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowQuoteForm(true)}><Plus size={14} /> Add Quotation</button>
          )}
          {rfq.status === 'quotes_received' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowQuoteForm(true)}><Plus size={14} /> Add Quotation</button>
          )}
        </div>
      </div>

      <div className="tabs no-print">
        {['details', 'quotations'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'details' ? 'RFQ Details' : `Quotations (${quotations.length})`}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card">
              <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>RFQ Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  ['Department', rfq.department],
                  ['Payment Terms', rfq.payment_terms],
                  ['Delivery Terms', rfq.delivery_terms || '—'],
                  ['Deadline', fmtDate(rfq.submission_deadline)],
                  ['Created', fmtDate(rfq.created_at)],
                  ['PR Reference', rfq.requisition_id ? `PR-${rfq.requisition_id}` : '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
              {rfq.description && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Description</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rfq.description}</p>
                </div>
              )}
              {rfq.special_instructions && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Special Instructions</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rfq.special_instructions}</p>
                </div>
              )}
            </div>
            <div className="card">
              <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invited Vendors ({rfq.vendors?.length || 0})</h3>
              {(rfq.vendors || []).map(rv => (
                <div key={rv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{rv.vendor?.company_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rv.vendor?.vendor_code}</div>
                  </div>
                  <span className={`badge ${rv.responded ? 'badge-green' : 'badge-muted'}`}>{rv.responded ? 'Responded' : 'Pending'}</span>
                </div>
              ))}
              {!rfq.vendors?.length && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No vendors invited</p>}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Line Items</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>#</th><th>Item Name</th><th>Description</th><th>Qty</th><th>UOM</th><th>Category</th><th>Target Price</th></tr>
                </thead>
                <tbody>
                  {rfq.line_items.map((item, i) => (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{item.item_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{item.description || '—'}</td>
                      <td>{item.quantity} {item.unit_of_measure}</td>
                      <td>{item.unit_of_measure}</td>
                      <td>{item.category || '—'}</td>
                      <td>{item.target_price ? `₹${fmt(item.target_price)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'quotations' && (
        <div>
          {quotations.length === 0 ? (
            <div className="empty-state">
              <h3>No quotations received yet</h3>
              <p>Quotations from vendors will appear here</p>
              {rfq.status !== 'draft' && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowQuoteForm(true)}><Plus size={14} /> Add Quotation</button>
              )}
            </div>
          ) : (
            <>
              {lowestQuote && (
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  Lowest quote: <strong>{lowestQuote.vendor?.company_name}</strong> — ₹{fmt(lowestQuote.total_amount)}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {quotations.map(q => (
                  <div key={q.id} className="card" style={{
                    border: q.is_lowest ? '1px solid var(--accent-border)' : '1px solid var(--border-subtle)',
                    background: q.is_selected ? 'var(--accent-dim)' : 'var(--bg-card)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{q.vendor?.company_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.quotation_number}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {q.is_lowest && <span className="badge badge-green">Lowest</span>}
                        {q.is_selected && <span className="badge badge-accent">Awarded</span>}
                        <span className={`badge ${q.status === 'accepted' ? 'badge-green' : q.status === 'rejected' ? 'badge-red' : 'badge-blue'}`}>{q.status}</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      {[
                        ['Subtotal', `₹${fmt(q.subtotal)}`],
                        ['Tax', `₹${fmt(q.tax_amount)}`],
                        ['Total', `₹${fmt(q.total_amount)}`],
                        ['Delivery', q.delivery_days ? `${q.delivery_days} days` : '—'],
                        ['Validity', `${q.validity_days} days`],
                        ['Payment', q.payment_terms || '—'],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {q.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{q.notes}</p>}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4, fontSize: 12, marginBottom: 14 }}>
                      {q.line_items.map((li, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{li.item_name} × {li.quantity}</span>
                          <span style={{ fontWeight: 500 }}>₹{fmt(li.unit_price)}/unit</span>
                        </div>
                      ))}
                    </div>
                    {rfq.status !== 'awarded' && q.status === 'submitted' && (
                      <button className="btn btn-success btn-sm" style={{ width: '100%' }} onClick={() => handleAward(q.id)}>
                        <Award size={13} /> Award to {q.vendor?.company_name}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showQuoteForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowQuoteForm(false)}>
          <div className="modal modal-wide">
            <div className="modal-header">
              <h3 className="modal-title">Submit Quotation</h3>
              <button className="btn-ghost" onClick={() => setShowQuoteForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitQuote}>
              <div className="form-row" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="input-label">Vendor *</label>
                  <select className="input" value={quoteForm.vendor_id} onChange={e => setQuoteForm(f => ({ ...f, vendor_id: e.target.value }))} required>
                    <option value="">Select vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Payment Terms</label>
                  <select className="input" value={quoteForm.payment_terms} onChange={e => setQuoteForm(f => ({ ...f, payment_terms: e.target.value }))}>
                    {['NET30', 'NET45', 'NET60', 'ADVANCE', 'COD'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Validity (days)</label>
                  <input className="input" type="number" value={quoteForm.validity_days} onChange={e => setQuoteForm(f => ({ ...f, validity_days: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="input-label">Delivery (days)</label>
                  <input className="input" type="number" value={quoteForm.delivery_days} onChange={e => setQuoteForm(f => ({ ...f, delivery_days: e.target.value }))} placeholder="Days from order" />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 10 }}>Pricing</div>
                <table className="line-items-table">
                  <thead>
                    <tr><th>Item</th><th>Qty</th><th>UOM</th><th>Unit Price (₹) *</th><th>GST %</th><th>HSN</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {quoteItems.map((item, i) => {
                      const total = (parseFloat(item.unit_price) || 0) * item.quantity * (1 + (parseFloat(item.tax_rate) || 0) / 100)
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 500, fontSize: 12, padding: '8px 4px' }}>{item.item_name}</td>
                          <td style={{ padding: '8px 4px', fontSize: 12 }}>{item.quantity} {item.unit_of_measure}</td>
                          <td style={{ padding: '8px 4px', fontSize: 12 }}>{item.unit_of_measure}</td>
                          <td><input className="input" type="number" min="0" step="any" value={item.unit_price} onChange={e => setQuoteItems(prev => prev.map((it, idx) => idx === i ? { ...it, unit_price: e.target.value } : it))} required placeholder="0.00" /></td>
                          <td><input className="input" type="number" min="0" max="28" step="0.01" value={item.tax_rate} onChange={e => setQuoteItems(prev => prev.map((it, idx) => idx === i ? { ...it, tax_rate: e.target.value } : it))} /></td>
                          <td><input className="input" value={item.hsn_code} onChange={e => setQuoteItems(prev => prev.map((it, idx) => idx === i ? { ...it, hsn_code: e.target.value } : it))} placeholder="HSN" /></td>
                          <td style={{ fontWeight: 500, fontSize: 12, padding: '8px 4px' }}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="form-group">
                <label className="input-label">Notes</label>
                <textarea className="input" rows={2} value={quoteForm.notes} onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional terms or conditions..." />
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuoteForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting...' : 'Submit Quotation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
