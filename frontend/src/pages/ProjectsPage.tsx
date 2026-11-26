import { Link } from 'react-router-dom'
import Badge, { Tone } from '../components/Badge'
import { Card } from '../components/Card'
import Loading from '../components/Loading'
import { EmptyState, ErrorState, PageHeader } from '../components/PageState'
import ProgressBar from '../components/ProgressBar'
import { PROJECT_STATUS_LABELS } from '../constants/labels'
import { getGameState } from '../features/game/gameApi'
import { getProjects } from '../features/projects/projectsApi'
import { useResource } from '../hooks/useResource'
import { describeDeadline } from '../utils/format'
import { formatMoney } from '../utils/money'

const STATUS_TONE: Record<string, Tone> = { in_progress: 'primary', completed: 'success', failed: 'danger' }

export default function ProjectsPage() {
  const projects = useResource(getProjects, { interval: 15000 })
  const game = useResource(() => getGameState().catch(() => null), { interval: 30000 })
  const today = game.data?.game_day

  if (projects.loading && !projects.data) return <Loading />
  if (!projects.data) return <ErrorState message={projects.error || 'Не вдалося завантажити проєкти'} onRetry={() => void projects.reload()} />

  const active = projects.data.filter((p) => p.status === 'in_progress')
  const finished = projects.data.filter((p) => p.status !== 'in_progress')

  const renderCard = (p: (typeof active)[number]) => (
    <Link key={p.id} to={`/projects/${p.id}`} className="block">
      <Card className="flex h-full flex-col gap-3 transition-colors hover:border-primary">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold">{p.contract.title}</h3>
          <Badge tone={STATUS_TONE[p.status] ?? 'default'}>{PROJECT_STATUS_LABELS[p.status] ?? p.status}</Badge>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted"><span>Загальний прогрес</span><span>{p.progress}%</span></div>
          <ProgressBar value={p.progress} label={`Прогрес проєкту ${p.contract.title}`} />
        </div>
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-muted">Дедлайн</dt>
          <dd className={today !== undefined && p.deadline < today && p.status === 'in_progress' ? 'text-danger' : ''}>{describeDeadline(p.deadline, today)}</dd>
          <dt className="text-muted">Якість</dt><dd>{p.quality}/100</dd>
          <dt className="text-muted">Бюджет</dt><dd>{formatMoney(p.contract.budget)}</dd>
        </dl>
      </Card>
    </Link>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Проєкти" subtitle="Активні та завершені проєкти компанії" />

      {projects.data.length === 0 ? (
        <EmptyState title="Проєктів ще немає" text="Прийміть контракт на біржі, і тут зʼявиться проєкт із завданнями." action={<Link to="/contracts" className="text-sm text-primary hover:underline">Перейти до контрактів</Link>} />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-semibold">Активні ({active.length})</h2>
            {active.length === 0 ? <p className="text-sm text-muted">Немає активних проєктів</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{active.map(renderCard)}</div>}
          </section>
          {finished.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-semibold">Завершені ({finished.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{finished.map(renderCard)}</div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
