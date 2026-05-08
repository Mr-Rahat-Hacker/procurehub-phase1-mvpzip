import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { vendorApi } from '../api/client'
import useToastStore from '../store/toastStore'
import { Plus, Search, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import VendorModal from '../components/vendor/VendorModal'

const STATUS_BADGE = {
  pending: 'badge-amber', under_review: 'badge-blue',
  approved: 'badge-green', rejected: 'badge-red', blacklisted: 'badge-red',
}
const CATEGORIES = ['', 'manufacturing', 'it_services', 'logistics', 'raw_materials', 'mro', 'professional_services', 'utilities', 'other']
const STATUSES = ['', 'pending', 'under_review', 'approved', 'rejected', 'blacklisted']

export default function VendorsPage() {
  const toast = useToastStore()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editVendor, setEditVendor] = useState(null)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await vendorApi.list({ search: search || undefined, status: statusFilter || undefined })
      setVendors(res.data)
    } catch {
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { fetchVendors() }, [fetchVendors])

  const handleStatusChange = async (id, status) => {
    try {
      await vendorApi.updateStatus(id, { status })
      toast.success(`Vendor ${status}`)
      fetchVendors()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleSave = () => {
    setShowModal(false)
    setEditVendor(null)
    fetchVendors()
    toast.success('Vendor saved')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">Manage your supplier master data</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditVendor(null); setShowModal(true) }}>
          <Plus size={14} /> Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search vendors..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '32px' }} />
        </div>
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: '140px' }}>
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchVendors}><RefreshCw size={13} /></button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vendor Code</th>
              <th>Company</th>
              <th>Category</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Payment Terms</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : vendors.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">🏢</div>
                  <p>No vendors found</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={13} /> Add First Vendor</button>
                </div>
              </td></tr>
            ) : vendors.map((v) => (
              <tr key={v.id}>
                <td><span className="mono" style={{ fontSize: '12px', color: 'var(--text-accent)' }}>{v.vendor_code}</span></td>
                <td>
                  <Link to={`/vendors/${v.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v.company_name}</Link>
                  {v.gstin && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GSTIN: {v.gstin}</div>}
                </td>
                <td style={{ textTransform: 'capitalize' }}>{v.category?.replace('_', ' ')}</td>
                <td>
                  <div>{v.contact_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.contact_email}</div>
                </td>
                <td><span className={`badge ${STATUS_BADGE[v.status]}`}>{v.status.replace('_', ' ')}</span></td>
                <td><span className="mono" style={{ fontSize: '12px' }}>{v.payment_terms}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => { setEditVendor(v); setShowModal(true) }}>Edit</button>
                    {v.status === 'pending' || v.status === 'under_review' ? (
                      <>
                        <button className="btn btn-sm" style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}
                          onClick={() => handleStatusChange(v.id, 'approved')}>
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(v.id, 'rejected')}>
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    ) : v.status === 'approved' ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={11} color="var(--green)" /> Active
                      </span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <VendorModal vendor={editVendor} onClose={() => { setShowModal(false); setEditVendor(null) }} onSave={handleSave} />
      )}
    </div>
  )
}
