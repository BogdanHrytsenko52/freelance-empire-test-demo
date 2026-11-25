import { api } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import type { Company } from '../../types'

export async function getMyCompany(): Promise<Company> {
  const { data } = await api.get<Company>(ENDPOINTS.company.me)
  return data
}

// Початковий баланс (100 000 ₴) встановлює сервер.
export async function createCompany(name: string): Promise<Company> {
  const { data } = await api.post<Company>(ENDPOINTS.company.root, { name })
  return data
}

// Через PATCH дозволено змінювати лише назву: balance, reputation і level сервер не приймає.
export async function renameCompany(name: string): Promise<Company> {
  const { data } = await api.patch<Company>(ENDPOINTS.company.me, { name })
  return data
}
