export * from './game'

export interface ApiError {
  message: string
  status?: number
  details?: unknown
}

export type Role = 'player' | 'moderator' | 'admin'

export interface User {
  id: number
  username: string
  email: string
  role: Role
  date_joined: string
  is_active: boolean
}

export interface TokenPair {
  access: string
  refresh: string
}

// SimpleJWT за замовчуванням логінить за username.
export interface LoginPayload {
  username: string
  password: string
}

// Роль ніколи не передаємо: її не можна встановити самостійно.
export interface RegisterPayload {
  username: string
  email: string
  password: string
}
