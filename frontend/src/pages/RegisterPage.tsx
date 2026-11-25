import { Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import { useAuth } from '../features/auth/AuthContext'
import RegisterForm from '../features/auth/RegisterForm'

export default function RegisterPage() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return (
    <AuthLayout title="Реєстрація" subtitle="Створіть акаунт і запустіть фріланс-компанію">
      <RegisterForm />
    </AuthLayout>
  )
}
