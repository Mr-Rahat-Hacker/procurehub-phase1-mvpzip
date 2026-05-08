import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { rfqApi } from '../api/client'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function PrintRFQPage() {
  const { id } = useParams()
  const [rfq, setRfq] = useState(null)

  useEffect(() => {
    rfqApi.get(id).then(r => {
      setRfq(r.data)
      setTimeout(() => window.print(), 800)
    })
  }, [id])

  if (!rfq) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Loading...</div>

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: '0 auto', padding: '40px', color: '#1a1a1a', fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #00a88a', paddingBottom: 20, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#00a88a', fontFamily: 'monospace' }}>ProcureHub</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Enterprise Procurement Platform</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>REQUEST FOR QUOTATION</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#00a88a', fontFamily: 'monospace', marginTop: 4 }}>{rfq.rfq_number}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Date: {fmtDate(rfq.created_at)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, border: '1px solid #e2eaf4' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>RFQ Details</div>
          {[
            ['Title', rfq.title],
            ['Department', rfq.department],
            ['Payment Terms', rfq.payment_terms],
            ['Delivery Terms', rfq.delivery_terms || '—'],
            ['Submission Deadline', fmtDate(rfq.submission_deadline)],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', marginBottom: 6 }}>
              <span style={{ width: 120, color: '#666', fontSize: 12 }}>{l}:</span>
              <span style={{ fontWeight: 500, fontSize: 12 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#eff6ff', borderRadius: 8, padding: 16, border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Instructions to Vendors</div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
            <li>Please submit your quotation before the deadline</li>
            <li>Prices must include all taxes and delivery charges</li>
            <li>Mention HSN codes for all items</li>
            <li>Validity of quotation: minimum 30 days</li>
            {rfq.special_instructions && <li>{rfq.special_instructions}</li>}
          </ul>
        </div>
      </div>

      {rfq.description && (
        <div style={{ background: '#fffbeb', borderRadius: 6, padding: '10px 14px', marginBottom: 20, border: '1px solid #fde68a', fontSize: 12 }}>
          <strong>Scope / Description:</strong> {rfq.description}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Items Required</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['#', 'Item Code', 'Item Name / Description', 'Qty', 'UOM', 'Category', 'Target Price', 'Quoted Price'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e2eaf4', color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rfq.line_items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{i + 1}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#64748b' }}>{item.item_code || '—'}</td>
                <td style={{ padding: '8px 10px' }}>
                  <div style={{ fontWeight: 500 }}>{item.item_name}</div>
                  {item.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.description}</div>}
                </td>
                <td style={{ padding: '8px 10px' }}>{item.quantity}</td>
                <td style={{ padding: '8px 10px' }}>{item.unit_of_measure}</td>
                <td style={{ padding: '8px 10px' }}>{item.category || '—'}</td>
                <td style={{ padding: '8px 10px' }}>{item.target_price ? `₹${item.target_price.toLocaleString('en-IN')}` : '—'}</td>
                <td style={{ padding: '8px 10px', minWidth: 80, borderBottom: '1px dashed #94a3b8' }}></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={7} style={{ padding: '10px', textAlign: 'right', borderTop: '2px solid #e2eaf4', fontWeight: 700 }}>Total Quoted Amount:</td>
              <td style={{ padding: '10px', borderTop: '2px solid #e2eaf4', borderBottom: '1px dashed #94a3b8', minWidth: 80 }}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 8, marginTop: 32, fontSize: 11, color: '#64748b' }}>Authorized by (Buyer)</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 8, marginTop: 32, fontSize: 11, color: '#64748b' }}>Vendor Signature & Stamp</div>
        </div>
      </div>

      <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid #e2eaf4', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
        Generated by ProcureHub — {new Date().toLocaleString('en-IN')} · {rfq.rfq_number}
      </div>
    </div>
  )
}
