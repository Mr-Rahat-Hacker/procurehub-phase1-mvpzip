import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { rfqApi } from '../api/client'
import { FileSearch, Plus, Send, Award } from 'lucide-react'

const statusBadge = {
  draft: 'badge-muted', sent: 'badge-blue', quotes_received: 'badge-purple',
  under_evaluation: 'badge-amber', awarded: 'badge-green', cancelled: 'badge-red',
}

export default function RFQListPage() {
  const [rfqs, setRfqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    rfqApi.list().then(r => { setRfqs(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Request for Quotation</h1>
          <p className="page-subtitle">Manage RFQs and supplier quotations</p>
        </div>
        <Link to="/rfqs/new" className="btn btn-primary btn-sm"><Plus size={14} /> New RFQ</Link>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        rfqs.length === 0 ? (
          <div className="empty-state">
            <FileSearch size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <h3>No RFQs yet</h3>
            <p>Create an RFQ to collect quotes from multiple suppliers</p>
            <Link to="/rfqs/new" className="btn btn-primary btn-sm"><Plus size={14} /> Create RFQ</Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>RFQ Number</th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Vendors</th>
                    <th>Quotes</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rfqs.map(rfq => (
                    <tr key={rfq.id}>
                      <td><span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rfq.rfq_number}</span></td>
                      <td style={{ fontWeight: 500 }}>{rfq.title}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{rfq.department}</td>
                      <td>{rfq.vendors?.length || 0}</td>
                      <td>{rfq.quotation_count || 0}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {rfq.submission_deadline ? new Date(rfq.submission_deadline).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td><span className={`badge ${statusBadge[rfq.status] || 'badge-muted'}`}>{rfq.status.replace(/_/g, ' ')}</span></td>
                      <td>
                        <Link to={`/rfqs/${rfq.id}`} className="btn btn-ghost btn-sm">View</Link>
                      </td>
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
