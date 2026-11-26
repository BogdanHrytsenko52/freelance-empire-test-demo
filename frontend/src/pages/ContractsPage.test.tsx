import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContractsPage from './ContractsPage'
import * as contractsApi from '../features/contracts/contractsApi'
import * as gameApi from '../features/game/gameApi'
import type { Contract } from '../types'

vi.mock('../features/contracts/contractsApi')
vi.mock('../features/game/gameApi')

const contract: Contract = {
  id: 3, client: { name: 'Олег Гринчук' }, title: 'Лендінг для кавʼярні', description: 'Сайт з меню.', budget: '30000.00',
  difficulty: 2, deadline: 12, requirements: 'Адаптивна верстка', status: 'available', created_at: '2026-01-01', accepted_at: null,
}

function setup() {
  render(<MemoryRouter><ContractsPage /></MemoryRouter>)
}

const user = userEvent.setup({ delay: null })

describe('ContractsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(gameApi.getGameState).mockResolvedValue({ game_day: 5 })
  })

  it('відображає картки контрактів із бюджетом і клієнтом', async () => {
    vi.mocked(contractsApi.getContracts).mockResolvedValue([contract])
    setup()
    expect(await screen.findByText('Лендінг для кавʼярні')).toBeInTheDocument()
    expect(screen.getByText('Олег Гринчук')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Прийняти контракт' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Обговорити з клієнтом' })).toHaveAttribute('href', '/contracts/3/chat')
  })

  it('показує порожній стан', async () => {
    vi.mocked(contractsApi.getContracts).mockResolvedValue([])
    setup()
    expect(await screen.findByText('Контрактів немає')).toBeInTheDocument()
  })

  it('показує помилку API і дає повторити запит', async () => {
    vi.mocked(contractsApi.getContracts).mockRejectedValueOnce({ isAxiosError: true, message: 'x', response: undefined })
    vi.mocked(contractsApi.getContracts).mockResolvedValueOnce([contract])
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Сервер недоступний')
    await user.click(screen.getByRole('button', { name: 'Спробувати ще раз' }))
    expect(await screen.findByText('Лендінг для кавʼярні')).toBeInTheDocument()
  })
})
