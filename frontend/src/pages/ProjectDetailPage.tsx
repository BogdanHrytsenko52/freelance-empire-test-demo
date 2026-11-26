import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Card, StatCard } from '../components/Card'
import Loading from '../components/Loading'
import Modal, { ConfirmDialog } from '../components/Modal'
import { ErrorState, PageHeader } from '../components/PageState'
import ProgressBar from '../components/ProgressBar'
import { useToast } from '../components/Toast'
import { PROJECT_STATUS_LABELS } from '../constants/labels'
import { toApiError } from '../api/client'
import { getEmployees } from '../features/employees/employeesApi'
import { getGameState } from '../features/game/gameApi'
import KanbanBoard from '../features/projects/KanbanBoard'
import { assignEmployee, getProject, submitProject, unassignEmployee } from '../features/projects/projectsApi'
import { useResource } from '../hooks/useResource'
import type { SubmitResult } from '../types'
import { describeDeadline } from '../utils/format'
import { formatMoney } from '../utils/money'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const toast = useToast()
  const project = useResource(() => getProject(projectId), { interval: 10000, deps: [projectId] })
  const employees = useResource(() => getEmployees(), { interval: 30000 })
  const game = useResource(() => getGameState().catch(() => null), { interval: 30000 })
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)

  async function change(action: () => Promise<unknown>, success: string) {
    setBusy(true)
    try {
      await action()
      toast.success(success)
      await project.refresh()
    } catch (e) {
      toast.error(toApiError(e).message)
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    setBusy(true)
    try {
      setResult(await submitProject(projectId))
      setConfirming(false)
      await project.refresh()
    } catch (e) {
      toast.error(toApiError(e).message)
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  if (project.loading && !project.data) return <Loading />
  if (!project.data) return <ErrorState message={project.error || 'Не вдалося завантажити проєкт'} onRetry={() => void project.reload()} />

  const p = project.data
  const today = game.data?.game_day
  const allDone = p.tasks.length > 0 && p.tasks.every((t) => t.status === 'done')
  const active = p.status === 'in_progress'
  const overdue = active && today !== undefined && p.deadline < today

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={p.contract.title}
        subtitle={`Клієнт: ${p.contract.client.name}`}
        actions={
          <div className="flex items-center gap-3">
            <Badge tone={active ? 'primary' : 'success'}>{PROJECT_STATUS_LABELS[p.status] ?? p.status}</Badge>
            <Button disabled={!active || !allDone} onClick={() => setConfirming(true)}>Здати проєкт</Button>
          </div>
        }
      />
      <Link to="/projects" className="-mt-4 text-xs text-muted hover:text-text">← До проєктів</Link>

      {active && !allDone && <Alert type="success">Здати проєкт можна, коли всі завдання у колонці Done. Прогрес рахує сервер.</Alert>}
      {overdue && <Alert>Дедлайн прострочено: за кожен день нараховується штраф.</Alert>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Загальний прогрес</p>
          <p className="mt-1 text-2xl font-semibold">{p.progress}%</p>
          <div className="mt-2"><ProgressBar value={p.progress} label="Загальний прогрес проєкту" /></div>
        </Card>
        <StatCard label="Дедлайн" value={`День ${p.deadline}`} hint={describeDeadline(p.deadline, today)} tone={overdue ? 'danger' : 'default'} />
        <StatCard label="Якість" value={`${p.quality}/100`} />
        <StatCard label="Бюджет" value={formatMoney(p.contract.budget)} />
      </div>

      <KanbanBoard
        tasks={p.tasks}
        employees={employees.data ?? []}
        busy={busy || !active}
        onAssign={(taskId, employeeId) => change(() => assignEmployee(projectId, employeeId, taskId), 'Працівника призначено')}
        onUnassign={(taskId, employeeId) => change(() => unassignEmployee(projectId, employeeId, taskId), 'Призначення знято')}
      />

      {confirming && (
        <ConfirmDialog
          title="Здати проєкт клієнту?"
          text="Клієнт оцінить якість, після чого сервер визначить виплату й зміну репутації."
          confirmLabel="Здати"
          loading={busy}
          onConfirm={() => void submit()}
          onCancel={() => setConfirming(false)}
        />
      )}

      {result && (
        <Modal title={result.accepted ? 'Проєкт прийнято' : 'Потрібне доопрацювання'} onClose={() => setResult(null)}>
          <p className="text-sm">{result.message}</p>
          {result.accepted && (
            <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-muted">Виплата</dt><dd className="font-medium text-success">{formatMoney(result.payout)}</dd>
              <dt className="text-muted">Репутація</dt><dd>{result.reputation_change > 0 ? '+' : ''}{result.reputation_change}</dd>
            </dl>
          )}
          <div className="mt-5 flex justify-end"><Button onClick={() => setResult(null)}>Закрити</Button></div>
        </Modal>
      )}
    </div>
  )
}
