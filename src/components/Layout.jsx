import { Outlet, useLocation } from 'react-router-dom'
import { FrontSidebar, BackSidebar } from './Sidebar'

export default function Layout() {
  const location = useLocation()
  const isBackoffice = location.pathname.startsWith('/backoffice')

  return (
    <div style={{ display: 'flex', background: '#0a0a14', color: '#e2e8f0', minHeight: '100vh' }}>
      {isBackoffice ? <BackSidebar /> : <FrontSidebar />}
      <div style={{ marginLeft: '240px', flex: 1, padding: '2rem', maxWidth: 'calc(100vw - 240px)' }}>
        <Outlet />
      </div>
    </div>
  )
}
