import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Loading from '../components/Loading'
import Modal, { ConfirmDialog } from '../components/Modal'
import { EmptyState, ErrorState, PageHeader } from '../components/PageState'
import { useToast } from '../components/Toast'
import { toApiError } from '../api/client'
import ContractCard from '../features/contracts/ContractCard'
import { acceptContract, getContracts } from '../features/contracts/contractsApi'
import { getGameState } from '../features/game/gameApi'
import { useResource } from '../hooks/useResource'
import type { Contract } from '../types'
import { describeDeadline, difficultyStars } from '../utils/format'
import { formatMoney } from '../utils/money'

type Filter = 'all' | 'open' | 'mine'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Усі' },
  { value: 'open', label: 'Доступні' },
  { value: 'mine', label: 'Мої' },
]

export default function ContractsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('open')
  const [viewing, setViewing] = useState<Contract | null>(null)
  const [toAccept, setToAccept] = useState<Contract | null>(null)
  const [accepting, setAccepting] = useState(false)

  const contracts = useResource(getContracts, { interval: 20000 })
  const game = useResource(() => getGameState().catch(() => null))
  const today = game.data?.game_day

  async function accept() {
    if (!toAccept) return
    setAccepting(true)
    try {
      const { project_id } = await acceptContract(toAccept.id)
      toast.success('Контракт прийнято, проєкт створено')
      navigate(`/projects/${project_id}`)
    } catch (e) {
      toast.error(toApiError(e).message)
      setToAccept(null)
      void contracts.refresh()
    } finally {
      setAccepting(false)
    }
  }

  if (contracts.loading && !contracts.data) return <Loading />
  if (!contracts.data) return <ErrorState message={contracts.error || 'Не вдалося завантажити контракти'} onRetry={() => void contracts.reload()} />

  const list = contracts.data.filter((c) => {
    const open = c.status === 'available' || c.status === 'negotiating'
    return filter === 'all' ? true : filter === 'open' ? open : !open || c.status === 'negotiating'
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Біржа контрактів" subtitle="Оберіть замовлення, обговоріть умови з клієнтом і прийміть у роботу" />

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button key={f.value} variant={filter === f.value ? 'primary' : 'ghost'} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Контрактів немає" text="Нові замовлення зʼявляються на біржі з часом." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <ContractCard key={c.id} contract={c} today={today} onView={setViewing} onAccept={setToAccept} />
          ))}
        </div>
      )}

      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)}>
          <div className="flex flex-col gap-3 text-sm">
            <p>{viewing.description}</p>
            <div>
              <p className="text-xs uppercase text-muted">Вимоги</p>
              <p>{viewing.requirements}</p>
            </div>
            <dl className="grid grid-cols-2 gap-y-1">
              <dt className="text-muted">Клієнт</dt><dd>{viewing.client.name}</dd>
              <dt className="text-muted">Бюджет</dt><dd>{formatMoney(viewing.budget)}</dd>
              <dt className="text-muted">Дедлайн</dt><dd>{describeDeadline(viewing.deadline, today)}</dd>
              <dt className="text-muted">Складність</dt><dd>{difficultyStars(viewing.difficulty)}</dd>
            </dl>
          </div>
        </Modal>
      )}

      {toAccept && (
        <ConfirmDialog
          title="Прийняти контракт?"
          text={`«${toAccept.title}» за ${formatMoney(toAccept.budget)}. Після прийняття створиться проєкт із завданнями.`}
          confirmLabel="Прийняти"
          loading={accepting}
          onConfirm={() => void accept()}
          onCancel={() => setToAccept(null)}
        />
      )}
    </div>
  )
}
