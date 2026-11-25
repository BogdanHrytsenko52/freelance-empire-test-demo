import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterForm from './RegisterForm'
import { AuthProvider } from './AuthContext'
import * as authApi from './authApi'

vi.mock('./authApi')

function setup() {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/company/create" element={<h1>Створення компанії</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function fill(password = 'secret123', confirm = 'secret123') {
  await userEvent.type(screen.getByLabelText('Імʼя користувача'), 'player_1')
  await userEvent.type(screen.getByLabelText('Email'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Пароль'), password)
  await userEvent.type(screen.getByLabelText('Повторіть пароль'), confirm)
  await userEvent.click(screen.getByRole('button', { name: 'Створити акаунт' }))
}

describe('RegisterForm', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
  })

  it('не відправляє форму, якщо паролі не збігаються', async () => {
    setup()
    await fill('secret123', 'different1')
    expect(screen.getByText('Паролі не збігаються')).toBeInTheDocument()
    expect(authApi.registerRequest).not.toHaveBeenCalled()
  })

  it('реєструє, входить і переходить до створення компанії', async () => {
    vi.mocked(authApi.registerRequest).mockResolvedValue()
    vi.mocked(authApi.loginRequest).mockResolvedValue({ access: 'acc', refresh: 'ref' })
    setup()
    await fill()
    expect(await screen.findByRole('heading', { name: 'Створення компанії' })).toBeInTheDocument()
    expect(authApi.registerRequest).toHaveBeenCalledWith({ username: 'player_1', email: 'a@b.co', password: 'secret123' })
  })

  it('показує помилки полів із API', async () => {
    vi.mocked(authApi.registerRequest).mockRejectedValue({
      isAxiosError: true,
      message: 'x',
      response: { status: 400, data: { email: ['Користувач з таким email вже існує'] } },
    })
    setup()
    await fill()
    expect(await screen.findByText('Користувач з таким email вже існує')).toBeInTheDocument()
  })
})
