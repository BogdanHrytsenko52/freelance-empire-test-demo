import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { CompanyProvider } from '../features/company/CompanyContext'

export default function PrivateRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return (
    <CompanyProvider>
      <Outlet />
    </CompanyProvider>
  )
}
