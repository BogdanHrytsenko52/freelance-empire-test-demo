import { api } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import { unwrapList } from '../../api/pagination'
import type { AppNotification, Paginated } from '../../types'

export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[] | Paginated<AppNotification>>(ENDPOINTS.notifications.list)
  return unwrapList(data)
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(ENDPOINTS.notifications.read(id))
}
