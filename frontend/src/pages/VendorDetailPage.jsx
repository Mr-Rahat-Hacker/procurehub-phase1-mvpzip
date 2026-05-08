import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { vendorApi } from '../api/client'
import useToastStore from '../store/toastStore'
import useAuthStore from '../store/authStore'
import { ArrowLeft, CheckCircle, XCircle, Edit } from 'lucide-react'
import { format } from 'date-fns'
import VendorModal from '../components/vendor/VendorModal'

const STATUS_BADGE = {
  pending: 'badge-amber', under_review: 'badge-blue',
  approved: 'badge-green', rejected: 'badge-red', blacklisted: 'badge-red',
}
const MANAGER_ROLES = ['admin', 'procurement_manager']

export default function VendorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToastStore()
  const { user } = useAuthStore()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const fetchVendor = async () => {
    try {
      const res = await vendorApi.get(id)
      setVendor(res.data)
    } catch {
      toast.error('Vendor not found')
      navigate('/vendors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVendor() }, [id])

  const updateStatus = async (status) => {
    setActing(true)
    try {
      await vendorApi.updateStatus(id, { status })
      toast.success(`Vendor ${status}`)
      fetchVendor()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update status')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!vendor) return null

  const isManager = MANAGER_ROLES.includes(user?.role)

  return (
    <div style={{ maxWidth: '860px' }}>
      <button className="btn btn-ghost" onClick={() => navigate('/vendors')}
        style={{ marginBottom: '16px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <ArrowLeft size={14} /> Back to Vendors
      </button>

      <div className="page-header">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{vendor.vendor_code}</div>
          <h1 className="page-title">{vendor.company_name}</h1>
          <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>{vendor.category?.replace(/_/g, ' ')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`badge ${STATUS_BADGE[vendor.status]}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
            {vendor.status.replace(/_/g, ' ')}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>
            <Edit size={13} /> Edit
          </button>
          {isManager && (vendor.status === 'pending' || vendor.status === 'under_review') && (
            <>
              <button className="btn btn-sm" style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}
                disabled={acting} onClick={() => updateStatus('approved')}>
                <CheckCircle size={13} /> Approve
              </button>
              <button className="btn btn-danger btn-sm" disabled={acting} onClick={() => updateStatus('rejected')}>
                <XCircle size={13} /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="card">
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Contact</h3>
          <InfoRow label="Contact Name" value={vendor.contact_name} />
          <InfoRow label="Email" value={vendor.contact_email} mono />
          <InfoRow label="Phone" value={vendor.contact_phone || '—'} />
          <InfoRow label="City" value={vendor.address_city || '—'} />
          <InfoRow label="State" value={vendor.address_state || '—'} />
        </div>
        <div className="card">
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Commercial</h3>
          <InfoRow label="GSTIN" value={vendor.gstin || '—'} mono />
          <InfoRow label="PAN" value={vendor.pan || '—'} mono />
          <InfoRow label="Payment Terms" value={vendor.payment_terms} mono />
          <InfoRow label="Risk Score" value={vendor.risk_score?.toFixed(1)} />
          <InfoRow label="Approved At" value={vendor.approved_at ? format(new Date(vendor.approved_at), 'dd MMM yyyy') : '—'} />
          <InfoRow label="Added" value={format(new Date(vendor.created_at), 'dd MMM yyyy')} />
        </div>
      </div>

      {showEdit && (
        <VendorModal
          vendor={vendor}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); fetchVendor(); toast.success('Vendor updated') }}
        />
      )}
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
