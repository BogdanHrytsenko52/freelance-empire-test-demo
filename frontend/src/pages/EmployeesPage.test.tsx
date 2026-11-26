import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EmployeesPage from './EmployeesPage'
import * as employeesApi from '../features/employees/employeesApi'
import * as companyApi from '../features/company/companyApi'
import type { Candidate, Company, Employee } from '../types'

vi.mock('../features/employees/employeesApi')
vi.mock('../features/company/companyApi')
vi.mock('../features/projects/projectsApi')

const employee: Employee = { id: 1, name: 'Олена Коваль', specialization: 'frontend', level: 'middle', salary: '32000.00', productivity: 1, is_available: true, hired_at: '2026-01-01', skills: [{ skill: 'React', value: 70 }] }
const candidate: Candidate = { id: 5, name: 'Богдан Лисенко', specialization: 'qa', level: 'middle', skills: [], expected_salary: '32000.00', is_available: true }
const company = (balance: string): Company => ({ id: 1, name: 'Acme', balance, reputation: 10, level: 1, completed_contracts: 0, created_at: '2026-01-01' })

function setup() {
  render(<MemoryRouter><EmployeesPage /></MemoryRouter>)
}

const user = userEvent.setup({ delay: null })

describe('EmployeesPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(employeesApi.getEmployees).mockResolvedValue([employee])
    vi.mocked(employeesApi.getCandidates).mockResolvedValue([candidate])
    vi.mocked(companyApi.getMyCompany).mockResolvedValue(company('100000.00'))
  })

  it('відображає список працівників', async () => {
    setup()
    expect(await screen.findByText('Олена Коваль')).toBeInTheDocument()
    expect(screen.getByText('React 70')).toBeInTheDocument()
  })

  it('наймає кандидата', async () => {
    vi.mocked(employeesApi.hireCandidate).mockResolvedValue({ ...employee, id: 9, name: 'Богдан Лисенко' })
    setup()
    await user.click(await screen.findByRole('button', { name: /Кандидати/ }))
    await user.click(await screen.findByRole('button', { name: 'Найняти' }))
    expect(employeesApi.hireCandidate).toHaveBeenCalledWith(5)
  })

  it('вимикає найм, якщо баланс від\'ємний', async () => {
    vi.mocked(companyApi.getMyCompany).mockResolvedValue(company('-500.00'))
    setup()
    await user.click(await screen.findByRole('button', { name: /Кандидати/ }))
    const hire = await screen.findByRole('button', { name: 'Найняти' })
    await waitFor(() => expect(hire).toBeDisabled())
  })

  it('показує помилку API', async () => {
    vi.mocked(employeesApi.getEmployees).mockRejectedValue({ isAxiosError: true, message: 'x', response: { status: 500, data: {} } })
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Помилка сервера')
  })

  it('просить підтвердження перед звільненням', async () => {
    vi.mocked(employeesApi.fireEmployee).mockResolvedValue()
    setup()
    await user.click(await screen.findByRole('button', { name: 'Звільнити' }))
    expect(employeesApi.fireEmployee).not.toHaveBeenCalled()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Звільнити' }))
    expect(employeesApi.fireEmployee).toHaveBeenCalledWith(1)
  })
})
