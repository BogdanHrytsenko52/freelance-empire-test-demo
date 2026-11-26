import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContractChatPage from './ContractChatPage'
import * as contractsApi from '../features/contracts/contractsApi'
import type { ChatState, Contract } from '../types'

vi.mock('../features/contracts/contractsApi')

const contract: Contract = {
  id: 5, client: { name: 'Марина Кравець' }, title: 'Корпоративний сайт', description: 'Сайт.', budget: '65000.00',
  difficulty: 2, deadline: 20, requirements: 'CMS', status: 'available', created_at: '2026-01-01', accepted_at: null,
}
const initial: ChatState = {
  messages: [{ id: 1, sender: 'npc', text: 'Вітаю! Готовий обговорити проєкт.', created_at: '2026-01-01' }],
  proposal: null, negotiations_left: 3, max_message_length: 500,
}

function setup() {
  render(
    <MemoryRouter initialEntries={['/contracts/5/chat']}>
      <Routes>
        <Route path="/contracts/:id/chat" element={<ContractChatPage />} />
        <Route path="/projects/:id" element={<h1>Проєкт</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

const user = userEvent.setup({ delay: null })

describe('ContractChatPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(contractsApi.getContract).mockResolvedValue(contract)
    vi.mocked(contractsApi.getChat).mockResolvedValue(initial)
  })

  it('відображає історію діалогу та поточну пропозицію', async () => {
    setup()
    expect(await screen.findByText('Вітаю! Готовий обговорити проєкт.')).toBeInTheDocument()
    expect(screen.getByText('Поточна пропозиція')).toBeInTheDocument()
    expect(screen.getByText(/залишилось 3/)).toBeInTheDocument()
  })

  it('надсилає повідомлення гравця та показує відповідь NPC', async () => {
    vi.mocked(contractsApi.sendChatMessage).mockResolvedValue({
      ...initial,
      messages: [
        ...initial.messages,
        { id: 2, sender: 'player', text: 'Чи можна збільшити бюджет?', created_at: '2026-01-01' },
        { id: 3, sender: 'npc', text: 'Можу підняти бюджет до 70 200 ₴.', created_at: '2026-01-01' },
      ],
      proposal: { budget: '70200.00', deadline: 20 },
      negotiations_left: 2,
    })
    setup()
    await user.type(await screen.findByLabelText('Повідомлення'), 'Чи можна збільшити бюджет?')
    await user.click(screen.getByRole('button', { name: 'Надіслати' }))
    expect(contractsApi.sendChatMessage).toHaveBeenCalledWith(5, 'Чи можна збільшити бюджет?')
    expect(await screen.findByText('Можу підняти бюджет до 70 200 ₴.')).toBeInTheDocument()
    expect(screen.getByText(/залишилось 2/)).toBeInTheDocument()
  })

  it('показує помилку (ліміт запитів) і повертає текст у поле', async () => {
    vi.mocked(contractsApi.sendChatMessage).mockRejectedValue({ isAxiosError: true, message: 'x', response: { status: 429, data: {} } })
    setup()
    await user.type(await screen.findByLabelText('Повідомлення'), 'Привіт')
    await user.click(screen.getByRole('button', { name: 'Надіслати' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Забагато запитів')
    expect(screen.getByLabelText('Повідомлення')).toHaveValue('Привіт')
  })

  it('приймає узгоджені умови й переходить до проєкту', async () => {
    vi.mocked(contractsApi.acceptContract).mockResolvedValue({ project_id: 42 })
    setup()
    await user.click(await screen.findByRole('button', { name: 'Прийняти узгоджені умови' }))
    await user.click(screen.getByRole('button', { name: 'Прийняти' }))
    expect(contractsApi.acceptContract).toHaveBeenCalledWith(5)
    expect(await screen.findByRole('heading', { name: 'Проєкт' })).toBeInTheDocument()
  })
})
