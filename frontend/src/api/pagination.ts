import type { Paginated } from '../types'

// DRF може повертати масив або { count, next, previous, results }. Приймаємо обидва формати.
export function unwrapList<T>(data: T[] | Paginated<T>): T[] {
  return Array.isArray(data) ? data : data.results
}
