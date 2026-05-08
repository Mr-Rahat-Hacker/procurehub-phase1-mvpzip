import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { poApi } from '../api/client'

const fmt = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function PrintPOPage() {
  const { id } = useParams()
  const [po, setPo] = useState(null)

  useEffect(() => {
    poApi.get(id).then(r => {
      setPo(r.data)
      setTimeout(() => window.print(), 800)
    })
  }, [id])

  if (!po) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Loading...</div>

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: '0 auto', padding: '40px', color: '#1a1a1a', fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #00a88a', paddingBottom: 20, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#00a88a', fontFamily: 'monospace' }}>ProcureHub</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Enterprise Procurement Platform</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Your Company Name · procurement@company.com</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>PURCHASE ORDER</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#00a88a', fontFamily: 'monospace', marginTop: 4 }}>{po.po_number}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Date: {fmtDate(po.created_at)}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Currency: {po.currency}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, border: '1px solid #e2eaf4' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Vendor / Supplier</div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{po.vendor?.company_name}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{po.vendor?.vendor_code}</div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, border: '1px solid #e2eaf4' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Order Details</div>
          {[
            ['Payment Terms', po.payment_terms],
            ['Expected Delivery', fmtDate(po.expected_delivery)],
            ['Status', po.status.replace(/_/g, ' ').toUpperCase()],
            ['PR Reference', po.requisition_id ? `PR-${po.requisition_id}` : '—'],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', marginBottom: 5 }}>
              <span style={{ width: 110, color: '#666', fontSize: 12 }}>{l}:</span>
              <span style={{ fontWeight: 500, fontSize: 12 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {po.delivery_address && (
        <div style={{ background: '#eff6ff', borderRadius: 6, padding: '10px 14px', marginBottom: 20, border: '1px solid #bfdbfe', fontSize: 12 }}>
          <strong>Delivery Address:</strong> {po.delivery_address}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Line Items</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['#', 'Item Name', 'HSN Code', 'Qty', 'UOM', 'Unit Price (₹)', 'GST %', 'Total (₹)'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: h === '#' || h === 'Item Name' || h === 'HSN Code' ? 'left' : 'right', borderBottom: '1px solid #e2eaf4', color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {po.line_items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{i + 1}</td>
                <td style={{ padding: '8px 10px', fontWeight: 500 }}>{item.item_name}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#64748b' }}>{item.hsn_code || '—'}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.unit_of_measure}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{fmt(item.unit_price)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.tax_rate}%</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 500 }}>₹{fmt(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {[
              ['Subtotal', po.subtotal],
              ['GST / Tax', po.tax_amount],
            ].map(([l, v]) => (
              <tr key={l}>
                <td colSpan={7} style={{ padding: '6px 10px', textAlign: 'right', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>{l}:</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', borderTop: '1px solid #f1f5f9', fontFamily: 'monospace' }}>₹{fmt(v)}</td>
              </tr>
            ))}
            <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
              <td colSpan={7} style={{ padding: '10px', textAlign: 'right', borderTop: '2px solid #e2eaf4', fontSize: 14 }}>TOTAL AMOUNT:</td>
              <td style={{ padding: '10px', textAlign: 'right', borderTop: '2px solid #e2eaf4', color: '#00a88a', fontSize: 16, fontFamily: 'monospace' }}>₹{fmt(po.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {po.notes && (
        <div style={{ background: '#fffbeb', borderRadius: 6, padding: '10px 14px', marginBottom: 20, border: '1px solid #fde68a', fontSize: 12 }}>
          <strong>Notes / Terms:</strong> {po.notes}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 40 }}>
        {['Authorized Signatory', "Vendor's Acknowledgement"].map(label => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 8, marginTop: 32, fontSize: 11, color: '#64748b' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid #e2eaf4', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
        Generated by ProcureHub — {new Date().toLocaleString('en-IN')} · {po.po_number} · This is a computer generated document.
      </div>
    </div>
  )
}
