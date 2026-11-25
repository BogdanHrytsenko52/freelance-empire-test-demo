const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type Errors<T> = Partial<Record<keyof T, string>>

export interface LoginValues {
  username: string
  password: string
}

export interface RegisterValues {
  username: string
  email: string
  password: string
  confirm: string
}

export function validateLogin(v: LoginValues): Errors<LoginValues> {
  const e: Errors<LoginValues> = {}
  if (!v.username.trim()) e.username = 'Введіть імʼя користувача'
  if (!v.password) e.password = 'Введіть пароль'
  return e
}

export function validateRegister(v: RegisterValues): Errors<RegisterValues> {
  const e: Errors<RegisterValues> = {}
  const username = v.username.trim()
  if (!username) e.username = 'Введіть імʼя користувача'
  else if (username.length < 3 || username.length > 30) e.username = 'Від 3 до 30 символів'
  else if (!/^[A-Za-z0-9_]+$/.test(username)) e.username = 'Лише латиниця, цифри та _'

  if (!v.email.trim()) e.email = 'Введіть email'
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Некоректний email'

  if (!v.password) e.password = 'Введіть пароль'
  else if (v.password.length < 8) e.password = 'Мінімум 8 символів'
  else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) e.password = 'Потрібні літери та цифри'

  if (!v.confirm) e.confirm = 'Повторіть пароль'
  else if (v.confirm !== v.password) e.confirm = 'Паролі не збігаються'
  return e
}
