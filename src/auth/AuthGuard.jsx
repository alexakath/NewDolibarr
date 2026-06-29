import { Navigate } from 'react-router-dom'

export default function AuthGuard({ children }) {
  const isAuthenticated = sessionStorage.getItem('backoffice_auth') === 'true'

  if (!isAuthenticated) {
    return <Navigate to="/backoffice" replace />
  }

  return children
}
