import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Input from '../components/Input'
import Loading from '../components/Loading'
import AuthLayout from '../layouts/AuthLayout'
import { getFieldErrors, toApiError } from '../api/client'
import { useCompany } from '../features/company/CompanyContext'
import { createCompany } from '../features/company/companyApi'
import { validateCompanyName } from '../features/company/validation'

export default function CompanyCreatePage() {
  const { status, setCompany } = useCompany()
  const [name, setName] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  if (status === 'loading') return <Loading />
  if (status === 'ready') return <Navigate to="/dashboard" replace /> // одна компанія на акаунт

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError('')
    const err = validateCompanyName(name)
    setFieldError(err)
    if (err) return

    setLoading(true)
    try {
      setCompany(await createCompany(name.trim())) // після цього сторінка перенаправляє на /dashboard
    } catch (e2) {
      const apiErr = toApiError(e2)
      const fields = getFieldErrors(apiErr)
      if (fields.name) setFieldError(fields.name)
      else setApiError(apiErr.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Створіть компанію" subtitle="На старті ви отримаєте 100 000 ігрових гривень">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {apiError && <Alert>{apiError}</Alert>}
        <Input label="Назва компанії" name="name" value={name} onChange={(e) => setName(e.target.value)} error={fieldError} />
        <Button type="submit" loading={loading}>Створити компанію</Button>
      </form>
    </AuthLayout>
  )
}
