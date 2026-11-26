import { api } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import { unwrapList } from '../../api/pagination'
import type { FinanceSummary, Paginated, Transaction, TransactionType } from '../../types'

export async function getTransactions(type?: TransactionType): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[] | Paginated<Transaction>>(ENDPOINTS.transactions, { params: type ? { type } : undefined })
  return unwrapList(data)
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const { data } = await api.get<FinanceSummary>(ENDPOINTS.company.finance)
  return data
}
