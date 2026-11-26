import { api } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import { unwrapList } from '../../api/pagination'
import type { AcceptResult, ChatState, Contract, Paginated } from '../../types'

export async function getContracts(): Promise<Contract[]> {
  const { data } = await api.get<Contract[] | Paginated<Contract>>(ENDPOINTS.contracts.list)
  return unwrapList(data)
}

export async function getContract(id: number): Promise<Contract> {
  const { data } = await api.get<Contract>(ENDPOINTS.contracts.detail(id))
  return data
}

export async function acceptContract(id: number): Promise<AcceptResult> {
  const { data } = await api.post<AcceptResult>(ENDPOINTS.contracts.accept(id))
  return data
}

// Чат іде лише через Django API: запитів до Groq із браузера немає.
export async function getChat(id: number): Promise<ChatState> {
  const { data } = await api.get<ChatState>(ENDPOINTS.contracts.chat(id))
  return data
}

export async function sendChatMessage(id: number, text: string): Promise<ChatState> {
  const { data } = await api.post<ChatState>(ENDPOINTS.contracts.chat(id), { text })
  return data
}
