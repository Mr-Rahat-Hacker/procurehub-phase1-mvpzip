import useToastStore from '../../store/toastStore'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const icons = {
  success: <CheckCircle size={16} color="var(--green)" />,
  error: <XCircle size={16} color="var(--red)" />,
  info: <Info size={16} color="var(--blue)" />,
}

export default function ToastContainer() {
  const { toasts, remove } = useToastStore()
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type]}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button className="btn-ghost" onClick={() => remove(t.id)} style={{ padding: '2px' }}>
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
