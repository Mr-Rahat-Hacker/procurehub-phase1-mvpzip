import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { prApi } from '../api/client'

const fmt = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function PrintPRPage() {
  const { id } = useParams()
  const [pr, setPr] = useState(null)

  useEffect(() => {
    prApi.get(id).then(r => {
      setPr(r.data)
      setTimeout(() => window.print(), 800)
    })
  }, [id])

  if (!pr) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Loading...</div>

  const total = pr.line_items.reduce((s, i) => s + (i.total_price || 0), 0)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: '0 auto', padding: '40px 40px', color: '#1a1a1a', fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #00a88a', paddingBottom: 20, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#00a88a', fontFamily: 'monospace' }}>ProcureHub</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Enterprise Procurement Platform</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>PURCHASE REQUISITION</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#00a88a', fontFamily: 'monospace', marginTop: 4 }}>{pr.pr_number}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Date: {fmtDate(pr.created_at)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, border: '1px solid #e2eaf4' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Requisition Details</div>
          {[
            ['Title', pr.title],
            ['Department', pr.department],
            ['Priority', pr.priority.toUpperCase()],
            ['Required By', fmtDate(pr.required_by)],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', marginBottom: 6 }}>
              <span style={{ width: 90, color: '#666', fontSize: 12 }}>{l}:</span>
              <span style={{ fontWeight: 500, fontSize: 12 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, border: '1px solid #e2eaf4' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Approval</div>
          {[
            ['Status', pr.status.replace(/_/g, ' ').toUpperCase()],
            ['Approved By', pr.approved_by || 'Pending'],
            ['Notes', pr.approval_notes || '—'],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', marginBottom: 6 }}>
              <span style={{ width: 90, color: '#666', fontSize: 12 }}>{l}:</span>
              <span style={{ fontWeight: 500, fontSize: 12 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {pr.description && (
        <div style={{ background: '#fffbeb', borderRadius: 6, padding: '10px 14px', marginBottom: 20, border: '1px solid #fde68a', fontSize: 12 }}>
          <strong>Description:</strong> {pr.description}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Line Items</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e2eaf4', color: '#475569' }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e2eaf4', color: '#475569' }}>Item Code</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e2eaf4', color: '#475569' }}>Item Name</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e2eaf4', color: '#475569' }}>Category</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #e2eaf4', color: '#475569' }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #e2eaf4', color: '#475569' }}>Unit Price (₹)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #e2eaf4', color: '#475569' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {pr.line_items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{i + 1}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#64748b' }}>{item.item_code || '—'}</td>
                <td style={{ padding: '8px 10px', fontWeight: 500 }}>{item.item_name}</td>
                <td style={{ padding: '8px 10px', color: '#64748b' }}>{item.category || '—'}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.quantity} {item.unit_of_measure}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{fmt(item.estimated_unit_price)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 500 }}>₹{fmt(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
              <td colSpan={6} style={{ padding: '10px', textAlign: 'right', borderTop: '2px solid #e2eaf4', fontSize: 13 }}>Estimated Total:</td>
              <td style={{ padding: '10px', textAlign: 'right', borderTop: '2px solid #e2eaf4', color: '#00a88a', fontSize: 14, fontFamily: 'monospace' }}>₹{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 40 }}>
        {['Raised By', 'Approved By', 'Authorized By'].map(label => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 8, marginTop: 32, fontSize: 11, color: '#64748b' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid #e2eaf4', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
        Generated by ProcureHub — {new Date().toLocaleString('en-IN')} · {pr.pr_number}
      </div>
    </div>
  )
}
