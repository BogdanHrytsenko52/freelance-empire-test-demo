import { api } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import { unwrapList } from '../../api/pagination'
import type { GameEvent, Paginated } from '../../types'

export async function getActiveEvents(): Promise<GameEvent[]> {
  const { data } = await api.get<GameEvent[] | Paginated<GameEvent>>(ENDPOINTS.events.list)
  return unwrapList(data)
}

export async function getEventHistory(): Promise<GameEvent[]> {
  const { data } = await api.get<GameEvent[] | Paginated<GameEvent>>(ENDPOINTS.events.history)
  return unwrapList(data)
}

// Наслідки визначає сервер. Рішення застосовується лише один раз.
export async function chooseEvent(eventId: number, choiceId: number): Promise<GameEvent> {
  const { data } = await api.post<GameEvent>(ENDPOINTS.events.choose(eventId), { choice_id: choiceId })
  return data
}
