import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ToastContainer from './ToastContainer'

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        padding: '32px 36px',
        overflowY: 'auto',
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  )
}
