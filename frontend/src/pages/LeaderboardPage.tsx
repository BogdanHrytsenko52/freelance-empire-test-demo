import { useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Card } from '../components/Card'
import Loading from '../components/Loading'
import { EmptyState, ErrorState, PageHeader } from '../components/PageState'
import Select from '../components/Select'
import { useCompany } from '../features/company/CompanyContext'
import { LeaderboardOrdering, getLeaderboard } from '../features/leaderboard/leaderboardApi'
import { useResource } from '../hooks/useResource'
import { formatMoney } from '../utils/money'

const ORDERINGS = [
  { value: 'reputation', label: 'За репутацією' },
  { value: 'balance', label: 'За капіталом' },
  { value: 'completed_contracts', label: 'За завершеними контрактами' },
]

export default function LeaderboardPage() {
  const { company } = useCompany()
  const [page, setPage] = useState(1)
  const [ordering, setOrdering] = useState<LeaderboardOrdering>('reputation')
  const { data, error, loading, reload } = useResource(() => getLeaderboard(page, ordering), { interval: 30000, deps: [page, ordering] })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Рейтинг компаній"
        subtitle="Капітал — це поточний баланс компанії"
        actions={<Select label="Сортування" options={ORDERINGS} value={ordering} onChange={(e) => { setOrdering(e.target.value as LeaderboardOrdering); setPage(1) }} />}
      />

      {loading && !data ? (
        <Loading />
      ) : !data ? (
        <ErrorState message={error || 'Не вдалося завантажити рейтинг'} onRetry={() => void reload()} />
      ) : data.results.length === 0 ? (
        <EmptyState title="Рейтинг порожній" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr><th className="py-2">Місце</th><th>Компанія</th><th>Репутація</th><th>Капітал</th><th>Контракти</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.results.map((e) => {
                  const own = company?.id === e.company_id
                  return (
                    <tr key={e.company_id} className={own ? 'bg-primary/10 font-medium' : ''} aria-current={own ? 'true' : undefined}>
                      <td className="py-2">{e.place}</td>
                      <td>{e.name} {own && <Badge tone="primary">Ваша компанія</Badge>}</td>
                      <td>{e.reputation}</td>
                      <td>{formatMoney(e.balance)}</td>
                      <td>{e.completed_contracts}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>Усього компаній: {data.count}</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" disabled={!data.previous} onClick={() => setPage((p) => p - 1)}>Назад</Button>
              <span>Сторінка {page}</span>
              <Button variant="ghost" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>Далі</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
