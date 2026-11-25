import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { tokenStorage } from '../../utils/storage'
import type { User } from '../../types'
import { fetchMe, logoutRequest } from './authApi'

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (access: string, refresh: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(() => !!tokenStorage.getAccess())
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback((access: string, refresh: string) => {
    tokenStorage.set(access, refresh)
    setAuth(true)
  }, [])

  const logout = useCallback(() => {
    const refresh = tokenStorage.getRefresh()
    const access = tokenStorage.getAccess()
    tokenStorage.clear()
    setAuth(false)
    setUser(null)
    if (refresh) {
      void (async () => {
        try {
          await logoutRequest(refresh, access)
        } catch {
          /* токен уже очищено локально, помилку ігноруємо */
        }
      })()
    }
  }, [])

  // Дані поточного користувача (роль, email) з /auth/me/.
  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    void (async () => {
      try {
        const me = await fetchMe()
        if (!cancelled) setUser(me ?? null)
      } catch {
        /* 401 обробляє клієнт (оновлення токена або вихід) */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  useEffect(() => {
    window.addEventListener('auth:logout', logout)
    return () => window.removeEventListener('auth:logout', logout)
  }, [logout])

  const value = useMemo(() => ({ isAuthenticated, user, login, logout }), [isAuthenticated, user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
