import { useEffect, useState } from 'react'
import { auditApi } from '../api/client'
import { Download, Activity, Filter } from 'lucide-react'

const actionBadge = {
  CREATE: 'badge-green', UPDATE: 'badge-blue', STATUS_CHANGE: 'badge-amber',
  DELETE: 'badge-red', SEND: 'badge-purple', AWARD: 'badge-accent',
  SUBMIT_QUOTATION: 'badge-blue', APPROVE: 'badge-green', REJECT: 'badge-red',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ resource_type: '', action: '' })

  const load = () => {
    const params = {}
    if (filters.resource_type) params.resource_type = filters.resource_type
    if (filters.action) params.action = filters.action
    auditApi.list(params).then(r => { setLogs(r.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(load, [filters])

  const handleExport = async () => {
    const res = await auditApi.export()
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit_log.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const resourceTypes = ['', 'PR', 'PO', 'RFQ', 'Quotation', 'GRN', 'Vendor', 'User']
  const actions = ['', 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'DELETE', 'SEND', 'AWARD', 'APPROVE', 'REJECT']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Complete trail of all system actions</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExport}><Download size={14} /> Export CSV</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <select className="input" style={{ width: 180 }} value={filters.resource_type} onChange={e => setFilters(f => ({ ...f, resource_type: e.target.value }))}>
            <option value="">All Resources</option>
            {resourceTypes.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="input" style={{ width: 180 }} value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
            <option value="">All Actions</option>
            {actions.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>{logs.length} entries</div>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        logs.length === 0 ? (
          <div className="empty-state">
            <Activity size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <h3>No audit entries found</h3>
            <p>Actions in the system will be recorded here</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>Reference</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                        {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.user_email || 'System'}</td>
                      <td><span className={`badge ${actionBadge[log.action] || 'badge-muted'}`}>{log.action.replace(/_/g, ' ')}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.resource_type}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-accent)' }}>{log.resource_number || log.resource_id || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200 }}>
                        {log.new_value ? (
                          <span title={JSON.stringify(log.new_value)}>
                            {Object.entries(log.new_value).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </span>
                        ) : '—'}
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
