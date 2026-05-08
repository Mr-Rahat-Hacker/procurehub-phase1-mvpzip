import useAuthStore from '../store/authStore'

export default function SettingsPage() {
  const { user } = useAuthStore()
  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account and system preferences</p>
        </div>
      </div>
      <div className="card">
        <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Account Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 0', fontSize: '13px' }}>
          {[
            ['Name', user?.full_name],
            ['Email', user?.email],
            ['Role', user?.role?.replace('_', ' ')],
            ['Department', user?.department || '—'],
          ].map(([k, v]) => (
            <>
              <span key={k} style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span key={v} style={{ fontWeight: 500, textTransform: 'capitalize' }}>{v}</span>
            </>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginTop: '12px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Phase 2 Features (Coming Soon)</h3>
        {['SAP MM/SD Integration', 'Email Notifications', 'Audit Log Export', 'User Management', 'Custom Approval Workflows'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
            <span>{f}</span>
            <span className="badge badge-purple" style={{ fontSize: '10px' }}>Phase 2</span>
          </div>
        ))}
      </div>
    </div>
  )
}
