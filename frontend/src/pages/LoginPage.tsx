import { Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import { useAuth } from '../features/auth/AuthContext'
import LoginForm from '../features/auth/LoginForm'

export default function LoginPage() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return (
    <AuthLayout title="Вхід" subtitle="Увійдіть, щоб керувати своєю компанією">
      <LoginForm />
    </AuthLayout>
  )
}
