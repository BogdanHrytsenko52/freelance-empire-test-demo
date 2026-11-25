import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginForm from './LoginForm'
import { AuthProvider } from './AuthContext'
import * as authApi from './authApi'

vi.mock('./authApi')

function setup() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={<h1>Дашборд</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
  })

  it('показує помилки валідації й не викликає API', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Увійти' }))
    expect(screen.getByText('Введіть імʼя користувача')).toBeInTheDocument()
    expect(screen.getByText('Введіть пароль')).toBeInTheDocument()
    expect(authApi.loginRequest).not.toHaveBeenCalled()
  })

  it('виконує вхід, зберігає токени та переходить на dashboard', async () => {
    vi.mocked(authApi.loginRequest).mockResolvedValue({ access: 'acc', refresh: 'ref' })
    setup()
    await userEvent.type(screen.getByLabelText('Імʼя користувача'), 'player_1')
    await userEvent.type(screen.getByLabelText('Пароль'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Увійти' }))
    expect(await screen.findByRole('heading', { name: 'Дашборд' })).toBeInTheDocument()
    expect(localStorage.getItem('fe_access_token')).toBe('acc')
    expect(localStorage.getItem('fe_refresh_token')).toBe('ref')
  })

  it('відображає помилку API при невірних даних', async () => {
    vi.mocked(authApi.loginRequest).mockRejectedValue({ response: { status: 401, data: {} }, isAxiosError: true, message: 'x' })
    setup()
    await userEvent.type(screen.getByLabelText('Імʼя користувача'), 'player_1')
    await userEvent.type(screen.getByLabelText('Пароль'), 'wrongpass1')
    await userEvent.click(screen.getByRole('button', { name: 'Увійти' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(localStorage.getItem('fe_access_token')).toBeNull()
  })
})
