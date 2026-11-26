import { api } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import type { LeaderboardEntry, Paginated } from '../../types'

export type LeaderboardOrdering = 'reputation' | 'balance' | 'completed_contracts'

export async function getLeaderboard(page: number, ordering: LeaderboardOrdering): Promise<Paginated<LeaderboardEntry>> {
  const { data } = await api.get<LeaderboardEntry[] | Paginated<LeaderboardEntry>>(ENDPOINTS.leaderboard, { params: { page, ordering } })
  if (Array.isArray(data)) return { count: data.length, next: null, previous: null, results: data }
  return data
}
