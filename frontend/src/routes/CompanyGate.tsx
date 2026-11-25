import { Navigate, Outlet } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Loading from '../components/Loading'
import { useCompany } from '../features/company/CompanyContext'

// Ігрові сторінки доступні лише гравцю, у якого вже є компанія (одна на акаунт).
export default function CompanyGate() {
  const { status, error, reload } = useCompany()
  if (status === 'loading') return <Loading />
  if (status === 'none') return <Navigate to="/company/create" replace />
  if (status === 'error') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 p-8">
        <Alert>{error}</Alert>
        <Button onClick={() => void reload()}>Спробувати ще раз</Button>
      </div>
    )
  }
  return <Outlet />
}
