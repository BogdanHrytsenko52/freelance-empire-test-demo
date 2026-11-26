import { useState } from 'react'
import { Card, StatCard } from '../components/Card'
import Loading from '../components/Loading'
import { EmptyState, ErrorState, PageHeader } from '../components/PageState'
import Select from '../components/Select'
import { TRANSACTION_TYPE_LABELS } from '../constants/labels'
import { getMyCompany } from '../features/company/companyApi'
import FinanceChart from '../features/finance/FinanceChart'
import { getFinanceSummary, getTransactions } from '../features/finance/financeApi'
import { useResource } from '../hooks/useResource'
import type { TransactionType } from '../types'
import { formatMoney } from '../utils/money'

const FILTER_OPTIONS = [
  { value: '', label: 'Усі операції' },
  ...(Object.entries(TRANSACTION_TYPE_LABELS) as [TransactionType, string][]).map(([value, label]) => ({ value, label })),
]

export default function FinancePage() {
  const [type, setType] = useState<TransactionType | ''>('')
  const summary = useResource(async () => ({ company: await getMyCompany(), finance: await getFinanceSummary() }), { interval: 20000 })
  const txs = useResource(() => getTransactions(type || undefined), { interval: 20000, deps: [type] })

  if (summary.loading && !summary.data) return <Loading />
  if (!summary.data) return <ErrorState message={summary.error || 'Не вдалося завантажити дані'} onRetry={() => void summary.reload()} />

  const { company, finance } = summary.data
  const profit = Number(finance.profit)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Фінанси" subtitle="Історія операцій і статистика компанії" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Баланс" value={formatMoney(company.balance)} tone={Number(company.balance) < 0 ? 'danger' : 'default'} />
        <StatCard label="Доходи" value={formatMoney(finance.income)} tone="success" />
        <StatCard label="Витрати" value={formatMoney(finance.expenses)} tone="danger" />
        <StatCard label="Прибуток" value={formatMoney(finance.profit)} tone={profit >= 0 ? 'success' : 'danger'} />
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">За ігровими днями</h2>
        <FinanceChart data={finance.daily} />
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-semibold">Історія транзакцій</h2>
          <Select label="Тип операції" options={FILTER_OPTIONS} value={type} onChange={(e) => setType(e.target.value as TransactionType | '')} />
        </div>

        {txs.loading && !txs.data ? (
          <Loading />
        ) : txs.error && !txs.data ? (
          <ErrorState message={txs.error} onRetry={() => void txs.reload()} />
        ) : !txs.data || txs.data.length === 0 ? (
          <EmptyState title="Операцій не знайдено" text="Спробуйте інший фільтр або зачекайте на наступний ігровий день." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr><th className="py-2">День</th><th>Тип</th><th>Опис</th><th className="text-right">Сума</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {txs.data.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2">{t.game_day}</td>
                    <td>{TRANSACTION_TYPE_LABELS[t.type]}</td>
                    <td className="max-w-xs truncate">{t.description}</td>
                    <td className={`text-right ${Number(t.amount) >= 0 ? 'text-success' : 'text-danger'}`}>{formatMoney(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
