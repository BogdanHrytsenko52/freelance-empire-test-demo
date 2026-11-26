import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Card, StatCard } from '../components/Card'
import Alert from '../components/Alert'
import Loading from '../components/Loading'
import { EmptyState, ErrorState, PageHeader } from '../components/PageState'
import { useToast } from '../components/Toast'
import { TRANSACTION_TYPE_LABELS } from '../constants/labels'
import { getMyCompany } from '../features/company/companyApi'
import { getEmployees } from '../features/employees/employeesApi'
import FinanceChart from '../features/finance/FinanceChart'
import { getFinanceSummary, getTransactions } from '../features/finance/financeApi'
import { getGameState } from '../features/game/gameApi'
import { getNotifications, markNotificationRead } from '../features/notifications/notificationsApi'
import { getProjects } from '../features/projects/projectsApi'
import { useResource } from '../hooks/useResource'
import { toApiError } from '../api/client'
import { describeDeadline } from '../utils/format'
import { formatMoney } from '../utils/money'

async function loadDashboard() {
  const [company, employees, projects, transactions, notifications, finance, game] = await Promise.all([
    getMyCompany(),
    getEmployees(),
    getProjects(),
    getTransactions(),
    getNotifications(),
    getFinanceSummary(),
    getGameState().catch(() => null), // ендпоінт ігрового дня ще не узгоджено з backend
  ])
  return { company, employees, projects, transactions, notifications, finance, game }
}

export default function DashboardPage() {
  const toast = useToast()
  const { data, error, loading, reload, refresh } = useResource(loadDashboard, { interval: 15000 })

  if (loading && !data) return <Loading />
  if (!data) return <ErrorState message={error || 'Не вдалося завантажити дані'} onRetry={() => void reload()} />

  const { company, employees, projects, transactions, notifications, finance, game } = data
  const active = projects.filter((p) => p.status === 'in_progress')
  const deadlines = [...active].sort((a, b) => a.deadline - b.deadline).slice(0, 5)
  const unread = notifications.filter((n) => !n.is_read).slice(0, 5)
  const inDebt = Number(company.balance) < 0
  const today = game?.game_day

  async function markRead(id: number) {
    try {
      await markNotificationRead(id)
      await refresh()
    } catch (e) {
      toast.error(toApiError(e).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={company.name} subtitle={today !== undefined ? `Ігровий день ${today}` : 'Огляд компанії'} />

      {inDebt && <Alert>Баланс від'ємний: поки є борг, наймати нових працівників не можна.</Alert>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Баланс" value={formatMoney(company.balance)} tone={inDebt ? 'danger' : 'default'} />
        <StatCard label="Репутація" value={`${company.reputation}/100`} />
        <StatCard label="Рівень" value={company.level} hint={`Завершено контрактів: ${company.completed_contracts}`} />
        <StatCard label="Працівники" value={employees.length} />
        <StatCard label="Активні проєкти" value={active.length} />
        <StatCard label="Ігровий день" value={today ?? '—'} />
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Доходи та витрати за ігровими днями</h2>
        <FinanceChart data={finance.daily} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Найближчі дедлайни</h2>
          {deadlines.length === 0 ? (
            <EmptyState title="Активних проєктів немає" action={<Link to="/contracts" className="text-sm text-primary hover:underline">Перейти до біржі контрактів</Link>} />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {deadlines.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link to={`/projects/${p.id}`} className="truncate hover:text-primary">{p.contract.title}</Link>
                  <Badge tone={today !== undefined && p.deadline < today ? 'danger' : 'default'}>{describeDeadline(p.deadline, today)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Нові сповіщення</h2>
          {unread.length === 0 ? (
            <p className="text-sm text-muted">Нових сповіщень немає</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {unread.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-muted">{n.text}</p>
                  </div>
                  <Button variant="ghost" className="shrink-0 !px-2 !py-1 text-xs" onClick={() => void markRead(n.id)}>Прочитано</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Останні фінансові операції</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted">Операцій ще немає</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {transactions.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate">{t.description}</p>
                  <p className="text-xs text-muted">{TRANSACTION_TYPE_LABELS[t.type]} · день {t.game_day}</p>
                </div>
                <span className={Number(t.amount) >= 0 ? 'text-success' : 'text-danger'}>{formatMoney(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
