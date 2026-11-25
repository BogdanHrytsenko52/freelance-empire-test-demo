import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { getFieldErrors, toApiError } from '../../api/client'
import { useAuth } from './AuthContext'
import { loginRequest } from './authApi'
import { Errors, LoginValues, validateLogin } from './validation'

export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState<LoginValues>({ username: '', password: '' })
  const [errors, setErrors] = useState<Errors<LoginValues>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof LoginValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError('')
    const validation = validateLogin(values)
    setErrors(validation)
    if (Object.keys(validation).length) return

    setLoading(true)
    try {
      const tokens = await loginRequest({ username: values.username.trim(), password: values.password })
      login(tokens.access, tokens.refresh)
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      navigate(from ?? '/dashboard', { replace: true })
    } catch (err) {
      const apiErr = toApiError(err)
      setErrors((prev) => ({ ...prev, ...getFieldErrors(apiErr) }))
      setApiError(apiErr.status === 401 ? 'Невірне імʼя користувача або пароль' : apiErr.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {apiError && <Alert>{apiError}</Alert>}
      <Input label="Імʼя користувача" name="username" autoComplete="username" value={values.username} onChange={set('username')} error={errors.username} />
      <Input label="Пароль" name="password" type="password" autoComplete="current-password" value={values.password} onChange={set('password')} error={errors.password} />
      <Button type="submit" loading={loading}>Увійти</Button>
      <p className="text-center text-sm text-muted">
        Ще немає акаунта? <Link to="/register" className="text-primary hover:underline">Зареєструватися</Link>
      </p>
    </form>
  )
}
