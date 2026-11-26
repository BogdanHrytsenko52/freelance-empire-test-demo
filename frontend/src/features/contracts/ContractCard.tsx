import { Link } from 'react-router-dom'
import Badge, { Tone } from '../../components/Badge'
import Button from '../../components/Button'
import { Card } from '../../components/Card'
import { CONTRACT_STATUS_LABELS } from '../../constants/labels'
import type { Contract, ContractStatus } from '../../types'
import { describeDeadline, difficultyStars } from '../../utils/format'
import { formatMoney } from '../../utils/money'

const STATUS_TONE: Record<ContractStatus, Tone> = {
  available: 'primary', negotiating: 'warning', accepted: 'success', completed: 'success', failed: 'danger',
}

interface Props {
  contract: Contract
  today?: number
  busy?: boolean
  onView: (c: Contract) => void
  onAccept: (c: Contract) => void
}

export default function ContractCard({ contract: c, today, busy, onView, onAccept }: Props) {
  const open = c.status === 'available' || c.status === 'negotiating'
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">{c.title}</h3>
        <Badge tone={STATUS_TONE[c.status]}>{CONTRACT_STATUS_LABELS[c.status]}</Badge>
      </div>
      <p className="line-clamp-2 text-sm text-muted">{c.description}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Бюджет</dt><dd className="font-medium">{formatMoney(c.budget)}</dd>
        <dt className="text-muted">Дедлайн</dt><dd>{describeDeadline(c.deadline, today)}</dd>
        <dt className="text-muted">Складність</dt><dd aria-label={`Складність ${c.difficulty} з 5`}>{difficultyStars(c.difficulty)}</dd>
        <dt className="text-muted">Клієнт</dt><dd>{c.client.name}</dd>
      </dl>
      <div className="mt-auto flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => onView(c)}>Переглянути</Button>
        {open && (
          <>
            <Link to={`/contracts/${c.id}/chat`} className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-text">
              Обговорити з клієнтом
            </Link>
            <Button loading={busy} onClick={() => onAccept(c)}>Прийняти контракт</Button>
          </>
        )}
      </div>
    </Card>
  )
}
