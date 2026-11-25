import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '../utils/storage'
import { ENDPOINTS } from './endpoints'
import type { ApiError } from '../types'

// Єдиний HTTP-клієнт. Компоненти не роблять запитів напряму, а викликають функції з features/*/…Api.ts.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) throw new Error('No refresh token')
  const { data } = await axios.post(`${API_URL}${ENDPOINTS.auth.refresh}`, { refresh })
  // Якщо на backend увімкнено ROTATE_REFRESH_TOKENS, приходить новий refresh.
  tokenStorage.set(data.access, data.refresh)
  return data.access as string
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const access = await refreshPromise
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      } catch {
        tokenStorage.clear()
        window.dispatchEvent(new Event('auth:logout'))
      }
    }
    return Promise.reject(toApiError(error))
  },
)

function extractMessage(data: unknown): string | undefined {
  if (!data) return undefined
  if (typeof data === 'string') return data.length < 200 ? data : undefined // відсікаємо HTML-сторінки помилок
  if (Array.isArray(data)) return typeof data[0] === 'string' ? data[0] : undefined
  if (typeof data === 'object') {
    const d = data as Record<string, unknown>
    for (const key of ['detail', 'message', 'error']) if (typeof d[key] === 'string') return d[key] as string
    const nf = d.non_field_errors
    if (Array.isArray(nf) && typeof nf[0] === 'string') return nf[0]
  }
  return undefined
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    let message = extractMessage(error.response?.data)
    if (!error.response) message = 'Сервер недоступний. Перевірте підключення'
    else if (status === 429) message = 'Забагато запитів. Зачекайте трохи й повторіть'
    else if (!message) message = status && status >= 500 ? 'Помилка сервера. Спробуйте пізніше' : error.message
    return { message, status, details: error.response?.data }
  }
  return { message: error instanceof Error ? error.message : 'Невідома помилка' }
}

// Помилки валідації полів у форматі DRF: { field: ["текст", ...] }
export function getFieldErrors(error: ApiError): Record<string, string> {
  const result: Record<string, string> = {}
  const d = error.details
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    for (const [key, value] of Object.entries(d as Record<string, unknown>)) {
      if (key !== 'non_field_errors' && Array.isArray(value) && typeof value[0] === 'string') result[key] = value[0]
    }
  }
  return result
}
