import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { getFieldErrors, toApiError } from '../../api/client'
import { useAuth } from './AuthContext'
import { loginRequest, registerRequest } from './authApi'
import { Errors, RegisterValues, validateRegister } from './validation'

export default function RegisterForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<RegisterValues>({ username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Errors<RegisterValues>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof RegisterValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError('')
    const validation = validateRegister(values)
    setErrors(validation)
    if (Object.keys(validation).length) return

    setLoading(true)
    try {
      const email = values.email.trim()
      await registerRequest({ username: values.username.trim(), email, password: values.password })
      const tokens = await loginRequest({ username: values.username.trim(), password: values.password })
      login(tokens.access, tokens.refresh)
      navigate('/company/create', { replace: true })
    } catch (err) {
      const apiErr = toApiError(err)
      const fieldErrors = getFieldErrors(apiErr)
      setErrors((prev) => ({ ...prev, ...fieldErrors }))
      setApiError(Object.keys(fieldErrors).length ? 'Перевірте виділені поля' : apiErr.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {apiError && <Alert>{apiError}</Alert>}
      <Input label="Імʼя користувача" name="username" autoComplete="username" value={values.username} onChange={set('username')} error={errors.username} />
      <Input label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} />
      <Input label="Пароль" name="password" type="password" autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} />
      <Input label="Повторіть пароль" name="confirm" type="password" autoComplete="new-password" value={values.confirm} onChange={set('confirm')} error={errors.confirm} />
      <Button type="submit" loading={loading}>Створити акаунт</Button>
      <p className="text-center text-sm text-muted">
        Вже є акаунт? <Link to="/login" className="text-primary hover:underline">Увійти</Link>
      </p>
    </form>
  )
}
