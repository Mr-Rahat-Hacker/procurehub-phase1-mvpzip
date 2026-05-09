import { useState } from 'react'
import { vendorApi } from '../../api/client'
import { X } from 'lucide-react'

const CATEGORIES = ['manufacturing', 'it_services', 'logistics', 'raw_materials', 'mro', 'professional_services', 'utilities', 'other']
const STATES = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Delhi', 'Uttar Pradesh', 'West Bengal', 'Telangana', 'Andhra Pradesh', 'Other']

export default function VendorModal({ vendor, onClose, onSave }) {
  const [form, setForm] = useState(vendor ? {
    company_name: vendor.company_name, contact_name: vendor.contact_name,
    contact_email: vendor.contact_email, contact_phone: vendor.contact_phone || '',
    gstin: vendor.gstin || '', pan: vendor.pan || '',
    address_line1: vendor.address_line1 || '', address_city: vendor.address_city || '',
    address_state: vendor.address_state || '', address_pincode: vendor.address_pincode || '',
    category: vendor.category, payment_terms: vendor.payment_terms,
    bank_name: vendor.bank_name || '', bank_account: vendor.bank_account || '',
    bank_ifsc: vendor.bank_ifsc || '', notes: vendor.notes || '',
  } : {
    company_name: '', contact_name: '', contact_email: '', contact_phone: '',
    gstin: '', pan: '', address_line1: '', address_city: '', address_state: '',
    address_pincode: '', category: 'manufacturing', payment_terms: 'NET30',
    bank_name: '', bank_account: '', bank_ifsc: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('basic')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.company_name || !form.contact_name || !form.contact_email) {
      setError('Company name, contact name, and email are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (vendor) await vendorApi.update(vendor.id, form)
      else await vendorApi.create(form)
      onSave()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save vendor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2 className="modal-title">{vendor ? 'Edit Vendor' : 'Register New Vendor'}</h2>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={15} /></button>
        </div>

        <div className="modal-body">
          <div className="tabs">
            {[['basic', 'Basic Info'], ['address', 'Address'], ['banking', 'Banking']].map(([t, label]) => (
              <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{label}</div>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {tab === 'basic' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Company Name *</label>
                  <input className="input" value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Full legal company name" />
                </div>
                <div className="form-group">
                  <label className="input-label">Category</label>
                  <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Contact Person *</label>
                  <input className="input" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Primary contact name" />
                </div>
                <div className="form-group">
                  <label className="input-label">Contact Email *</label>
                  <input className="input" type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="contact@vendor.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Phone</label>
                  <input className="input" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="form-group">
                  <label className="input-label">Payment Terms</label>
                  <select className="input" value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)}>
                    {['NET15', 'NET30', 'NET45', 'NET60', 'ADVANCE', 'COD'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">GSTIN</label>
                  <input className="input mono" placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())} />
                </div>
                <div className="form-group">
                  <label className="input-label">PAN</label>
                  <input className="input mono" placeholder="AAAAA0000A" value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())} />
                </div>
              </div>
              <div className="form-group">
                <label className="input-label">Notes / Remarks</label>
                <textarea className="input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes about this vendor..." />
              </div>
            </>
          )}

          {tab === 'address' && (
            <>
              <div className="form-group">
                <label className="input-label">Street Address</label>
                <input className="input" value={form.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="Building, Street, Area" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">City</label>
                  <input className="input" value={form.address_city} onChange={e => set('address_city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="input-label">PIN Code</label>
                  <input className="input mono" value={form.address_pincode} onChange={e => set('address_pincode', e.target.value)} placeholder="400001" />
                </div>
              </div>
              <div className="form-group">
                <label className="input-label">State</label>
                <select className="input" value={form.address_state} onChange={e => set('address_state', e.target.value)}>
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}

          {tab === 'banking' && (
            <>
              <div className="form-group">
                <label className="input-label">Bank Name</label>
                <input className="input" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="e.g. State Bank of India" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Account Number</label>
                  <input className="input mono" value={form.bank_account} onChange={e => set('bank_account', e.target.value)} placeholder="Account number" />
                </div>
                <div className="form-group">
                  <label className="input-label">IFSC Code</label>
                  <input className="input mono" placeholder="SBIN0001234" value={form.bank_ifsc} onChange={e => set('bank_ifsc', e.target.value.toUpperCase())} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 13, height: 13 }} /> : vendor ? 'Save Changes' : 'Register Vendor'}
          </button>
        </div>
      </div>
    </div>
  )
}
