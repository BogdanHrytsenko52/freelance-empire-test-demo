import { FormEvent, useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import { Card } from '../components/Card'
import Input from '../components/Input'
import Loading from '../components/Loading'
import { PageHeader } from '../components/PageState'
import { useToast } from '../components/Toast'
import { ROLE_LABELS } from '../constants/labels'
import { getFieldErrors, toApiError } from '../api/client'
import { useAuth } from '../features/auth/AuthContext'
import { useCompany } from '../features/company/CompanyContext'
import { renameCompany } from '../features/company/companyApi'
import { validateCompanyName } from '../features/company/validation'
import { formatDate } from '../utils/format'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { company, setCompany } = useCompany()
  const toast = useToast()
  const [name, setName] = useState(company?.name ?? '')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError('')
    const err = validateCompanyName(name)
    setFieldError(err)
    if (err) return
    setSaving(true)
    try {
      setCompany(await renameCompany(name.trim()))
      toast.success('Назву компанії змінено')
    } catch (e2) {
      const apiErr = toApiError(e2)
      const fields = getFieldErrors(apiErr)
      if (fields.name) setFieldError(fields.name)
      else setApiError(apiErr.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Профіль" />

      <Card>
        <h2 className="mb-3 font-semibold">Дані користувача</h2>
        {!user ? (
          <Loading />
        ) : (
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <dt className="text-muted">Імʼя користувача</dt><dd>{user.username}</dd>
            <dt className="text-muted">Email</dt><dd>{user.email}</dd>
            <dt className="text-muted">Роль</dt><dd>{ROLE_LABELS[user.role] ?? user.role}</dd>
            <dt className="text-muted">Дата реєстрації</dt><dd>{formatDate(user.date_joined)}</dd>
          </dl>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">Налаштування компанії</h2>
        <p className="mb-3 text-sm text-muted">Змінити можна лише назву. Баланс, репутацію й рівень визначає сервер.</p>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {apiError && <Alert>{apiError}</Alert>}
          <Input label="Назва компанії" name="name" value={name} onChange={(e) => setName(e.target.value)} error={fieldError} />
          <Button type="submit" loading={saving} className="self-start">Зберегти</Button>
        </form>
      </Card>

      <Button variant="ghost" onClick={logout} className="self-start !text-danger">Вийти з акаунта</Button>
    </div>
  )
}
