import { api } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import type { LoginPayload, RegisterPayload, TokenPair, User } from '../../types'

export async function loginRequest(payload: LoginPayload): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>(ENDPOINTS.auth.token, payload)
  return data
}

export async function registerRequest(payload: RegisterPayload): Promise<void> {
  await api.post(ENDPOINTS.auth.register, payload)
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>(ENDPOINTS.auth.me)
  return data
}

// Відкликає refresh token (blacklist). access передаємо явно, бо локальні токени вже можуть бути очищені.
export async function logoutRequest(refresh: string, access?: string | null): Promise<void> {
  await api.post(ENDPOINTS.auth.logout, { refresh }, access ? { headers: { Authorization: `Bearer ${access}` } } : undefined)
}
