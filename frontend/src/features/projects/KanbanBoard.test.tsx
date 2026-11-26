import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { describe, it, expect, vi } from 'vitest'
import KanbanBoard from './KanbanBoard'
import type { Employee, ProjectTask } from '../../types'

const employees: Employee[] = [
  { id: 1, name: 'Олена Коваль', specialization: 'frontend', level: 'middle', salary: '32000.00', productivity: 1, is_available: true, hired_at: '2026-01-01', skills: [] },
  { id: 2, name: 'Максим Шевчук', specialization: 'backend', level: 'senior', salary: '52000.00', productivity: 1.4, is_available: true, hired_at: '2026-01-01', skills: [] },
]
const tasks: ProjectTask[] = [
  { id: 10, title: 'Верстка', required_specialization: 'frontend', work_total: 10, work_done: 0, status: 'todo', assignee_ids: [] },
  { id: 11, title: 'API', required_specialization: 'backend', work_total: 10, work_done: 5, status: 'in_progress', assignee_ids: [2] },
  { id: 12, title: 'Дизайн', required_specialization: 'designer', work_total: 4, work_done: 4, status: 'done', assignee_ids: [1] },
]

const user = userEvent.setup({ delay: null })

describe('KanbanBoard', () => {
  it('розкладає завдання за колонками To Do / In Progress / Done і показує прогрес', () => {
    render(<KanbanBoard tasks={tasks} employees={employees} onAssign={vi.fn()} onUnassign={vi.fn()} />)
    expect(within(screen.getByRole('region', { name: 'To Do' })).getByText('Верстка')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'In Progress' })).getByText('API')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Done' })).getByText('Дизайн')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Прогрес завдання API' })).toHaveAttribute('aria-valuenow', '50')
  })

  it('призначає працівника на завдання', async () => {
    const onAssign = vi.fn()
    render(<KanbanBoard tasks={tasks} employees={employees} onAssign={onAssign} onUnassign={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText('Призначити на Верстка'), '1')
    await user.click(within(screen.getByRole('article', { name: 'Верстка' })).getByRole('button', { name: 'Призначити' }))
    expect(onAssign).toHaveBeenCalledWith(10, 1)
  })

  it('знімає працівника із завдання', async () => {
    const onUnassign = vi.fn()
    render(<KanbanBoard tasks={tasks} employees={employees} onAssign={vi.fn()} onUnassign={onUnassign} />)
    await user.click(screen.getByRole('button', { name: 'Зняти Максим Шевчук' }))
    expect(onUnassign).toHaveBeenCalledWith(11, 2)
  })

  it('не дозволяє змінювати виконані завдання', () => {
    render(<KanbanBoard tasks={tasks} employees={employees} onAssign={vi.fn()} onUnassign={vi.fn()} />)
    const done = screen.getByRole('article', { name: 'Дизайн' })
    expect(within(done).queryByRole('button')).not.toBeInTheDocument()
  })
})
