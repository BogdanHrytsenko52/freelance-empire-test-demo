import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CompanyCreatePage from './CompanyCreatePage'
import { CompanyProvider } from '../features/company/CompanyContext'
import * as companyApi from '../features/company/companyApi'

vi.mock('../features/company/companyApi')

const company = { id: 1, name: 'Acme', balance: '100000.00', reputation: 0, level: 1, completed_contracts: 0, created_at: '2026-01-01' }

function setup() {
  vi.mocked(companyApi.getMyCompany).mockRejectedValue({ isAxiosError: true, message: 'x', response: { status: 404, data: {} } })
  render(
    <MemoryRouter initialEntries={['/company/create']}>
      <CompanyProvider>
        <Routes>
          <Route path="/company/create" element={<CompanyCreatePage />} />
          <Route path="/dashboard" element={<h1>Дашборд</h1>} />
        </Routes>
      </CompanyProvider>
    </MemoryRouter>,
  )
}

describe('CompanyCreatePage', () => {
  beforeEach(() => vi.resetAllMocks())

  it('не відправляє занадто коротку назву', async () => {
    setup()
    await userEvent.type(await screen.findByLabelText('Назва компанії'), 'ab')
    await userEvent.click(screen.getByRole('button', { name: 'Створити компанію' }))
    expect(screen.getByText('Від 3 до 50 символів')).toBeInTheDocument()
    expect(companyApi.createCompany).not.toHaveBeenCalled()
  })

  it('створює компанію і переходить на dashboard', async () => {
    setup()
    vi.mocked(companyApi.createCompany).mockResolvedValue(company)
    await userEvent.type(await screen.findByLabelText('Назва компанії'), 'Acme')
    await userEvent.click(screen.getByRole('button', { name: 'Створити компанію' }))
    expect(await screen.findByRole('heading', { name: 'Дашборд' })).toBeInTheDocument()
    expect(companyApi.createCompany).toHaveBeenCalledWith('Acme')
  })

  it('показує помилку API, якщо компанія вже існує', async () => {
    setup()
    vi.mocked(companyApi.createCompany).mockRejectedValue({
      isAxiosError: true,
      message: 'x',
      response: { status: 400, data: { detail: 'У вас уже є компанія' } },
    })
    await userEvent.type(await screen.findByLabelText('Назва компанії'), 'Acme')
    await userEvent.click(screen.getByRole('button', { name: 'Створити компанію' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('У вас уже є компанія')
  })
})
