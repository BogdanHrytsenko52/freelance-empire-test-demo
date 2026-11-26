import { useState } from 'react'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Card } from '../components/Card'
import Loading from '../components/Loading'
import { ConfirmDialog } from '../components/Modal'
import { EmptyState, ErrorState, PageHeader } from '../components/PageState'
import Select from '../components/Select'
import { useToast } from '../components/Toast'
import { LEVEL_LABELS, SPECIALIZATION_LABELS } from '../constants/labels'
import { toApiError } from '../api/client'
import { getMyCompany } from '../features/company/companyApi'
import AssignModal from '../features/employees/AssignModal'
import { fireEmployee, getCandidates, getEmployees, hireCandidate } from '../features/employees/employeesApi'
import { useResource } from '../hooks/useResource'
import type { Candidate, Employee, EmployeeSkill, Specialization } from '../types'
import { formatMoney } from '../utils/money'

const SPEC_OPTIONS = [
  { value: '', label: 'Усі спеціалізації' },
  ...(Object.entries(SPECIALIZATION_LABELS) as [Specialization, string][]).map(([value, label]) => ({ value, label })),
]

function Skills({ skills }: { skills: EmployeeSkill[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((s) => <Badge key={s.skill}>{s.skill} {s.value}</Badge>)}
    </div>
  )
}

export default function EmployeesPage() {
  const toast = useToast()
  const [tab, setTab] = useState<'team' | 'candidates'>('team')
  const [spec, setSpec] = useState<Specialization | ''>('')
  const [toFire, setToFire] = useState<Employee | null>(null)
  const [toAssign, setToAssign] = useState<Employee | null>(null)
  const [busy, setBusy] = useState(false)
  const [hiringId, setHiringId] = useState<number | null>(null)

  const team = useResource(() => getEmployees(spec || undefined), { deps: [spec] })
  const candidates = useResource(() => getCandidates(spec || undefined), { deps: [spec] })
  const company = useResource(getMyCompany)
  const inDebt = Number(company.data?.balance ?? 0) < 0

  async function hire(c: Candidate) {
    setHiringId(c.id)
    try {
      await hireCandidate(c.id)
      toast.success(`${c.name} найнято`)
      await Promise.all([team.refresh(), candidates.refresh(), company.refresh()])
    } catch (e) {
      toast.error(toApiError(e).message)
    } finally {
      setHiringId(null)
    }
  }

  async function fire() {
    if (!toFire) return
    setBusy(true)
    try {
      await fireEmployee(toFire.id)
      toast.success(`${toFire.name} звільнено`)
      setToFire(null)
      await Promise.all([team.refresh(), candidates.refresh()])
    } catch (e) {
      toast.error(toApiError(e).message)
    } finally {
      setBusy(false)
    }
  }

  const active = tab === 'team' ? team : candidates

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Працівники"
        subtitle="Керуйте командою та наймайте нових спеціалістів"
        actions={<Select label="Спеціалізація" options={SPEC_OPTIONS} value={spec} onChange={(e) => setSpec(e.target.value as Specialization | '')} />}
      />

      <div className="flex gap-2">
        <Button variant={tab === 'team' ? 'primary' : 'ghost'} aria-pressed={tab === 'team'} onClick={() => setTab('team')}>
          Команда{team.data ? ` (${team.data.length})` : ''}
        </Button>
        <Button variant={tab === 'candidates' ? 'primary' : 'ghost'} aria-pressed={tab === 'candidates'} onClick={() => setTab('candidates')}>
          Кандидати{candidates.data ? ` (${candidates.data.length})` : ''}
        </Button>
      </div>

      {tab === 'candidates' && inDebt && <Alert>Баланс від'ємний: найм вимкнено, поки компанія має борг.</Alert>}

      {active.loading && !active.data ? (
        <Loading />
      ) : !active.data ? (
        <ErrorState message={active.error || 'Не вдалося завантажити дані'} onRetry={() => void active.reload()} />
      ) : tab === 'team' ? (
        team.data && team.data.length === 0 ? (
          <EmptyState title="У вас ще немає працівників" text="Перейдіть до кандидатів і наймайте першу команду." action={<Button onClick={() => setTab('candidates')}>Переглянути кандидатів</Button>} />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr><th className="py-2">Імʼя</th><th>Спеціалізація</th><th>Рівень</th><th>Навички</th><th>Зарплата / міс.</th><th /></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {team.data?.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 font-medium">{e.name}</td>
                      <td>{SPECIALIZATION_LABELS[e.specialization]}</td>
                      <td>{LEVEL_LABELS[e.level]}</td>
                      <td><Skills skills={e.skills} /></td>
                      <td>{formatMoney(e.salary)}</td>
                      <td className="whitespace-nowrap text-right">
                        <Button variant="ghost" className="!px-2 !py-1" onClick={() => setToAssign(e)}>Призначити</Button>
                        <Button variant="ghost" className="!px-2 !py-1 !text-danger" onClick={() => setToFire(e)}>Звільнити</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : candidates.data && candidates.data.length === 0 ? (
        <EmptyState title="Кандидатів не знайдено" text="Спробуйте іншу спеціалізацію." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {candidates.data?.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted">{SPECIALIZATION_LABELS[c.specialization]} · {LEVEL_LABELS[c.level]}</p>
              </div>
              <Skills skills={c.skills} />
              <div className="mt-auto flex items-center justify-between">
                <span className="text-sm">{formatMoney(c.expected_salary)} / міс.</span>
                <Button disabled={inDebt} loading={hiringId === c.id} onClick={() => void hire(c)}>Найняти</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {toFire && (
        <ConfirmDialog
          title="Звільнити працівника?"
          text={`${toFire.name} буде звільнено й знято з усіх завдань. Цю дію не можна скасувати.`}
          confirmLabel="Звільнити"
          danger
          loading={busy}
          onConfirm={() => void fire()}
          onCancel={() => setToFire(null)}
        />
      )}
      {toAssign && <AssignModal employee={toAssign} onClose={() => { setToAssign(null); void team.refresh() }} />}
    </div>
  )
}
