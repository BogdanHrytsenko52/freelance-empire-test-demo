import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AppRoutes from './AppRoutes'
import { AuthProvider } from '../features/auth/AuthContext'
import * as companyApi from '../features/company/companyApi'

vi.mock('../features/auth/authApi')
vi.mock('../features/company/companyApi')

const company = { id: 1, name: 'Acme', balance: '100000.00', reputation: 10, level: 1, completed_contracts: 0, created_at: '2026-01-01' }

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
  })

  it('перенаправляє неавторизованого користувача на /login', () => {
    renderAt('/dashboard')
    expect(screen.getByRole('heading', { name: 'Вхід' })).toBeInTheDocument()
  })

  it('пускає гравця з компанією на dashboard', async () => {
    localStorage.setItem('fe_access_token', 'token')
    vi.mocked(companyApi.getMyCompany).mockResolvedValue(company)
    renderAt('/dashboard')
    expect(await screen.findByRole('heading', { name: 'Дашборд' })).toBeInTheDocument()
  })

  it('веде гравця без компанії на створення компанії', async () => {
    localStorage.setItem('fe_access_token', 'token')
    vi.mocked(companyApi.getMyCompany).mockRejectedValue({ isAxiosError: true, message: 'x', response: { status: 404, data: {} } })
    renderAt('/dashboard')
    expect(await screen.findByRole('heading', { name: 'Створіть компанію' })).toBeInTheDocument()
  })
})
