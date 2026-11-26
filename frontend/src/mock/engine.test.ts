import { beforeEach, describe, expect, it } from 'vitest'
import { MockDB, resetDB } from './db'
import { tick } from './engine'

let d: MockDB

beforeEach(() => {
  localStorage.clear()
  d = resetDB()
  d.company = { id: 1, name: 'Test', balance: '100000.00', reputation: 10, level: 1, completed_contracts: 0, created_at: '2026-01-01' }
  d.employees.push({ id: 900, name: 'Тест', specialization: 'frontend', level: 'middle', salary: '30000.00', productivity: 1, is_available: true, hired_at: '2026-01-01', skills: [] })
  d.projects.push({
    id: 901, contract_id: d.contracts[0].id, status: 'in_progress', progress: 0, quality: 0, deadline: 99,
    tasks: [{ id: 902, title: 'Верстка', required_specialization: 'frontend', work_total: 2, work_done: 0, status: 'todo', assignee_ids: [900] }],
  })
})

describe('мок-симуляція ігрового дня', () => {
  it('рахує прогрес завдань, зарплату й операційні витрати', () => {
    tick(d)
    const task = d.projects[0].tasks[0]
    expect(task.work_done).toBe(1)
    expect(task.status).toBe('in_progress')
    expect(d.projects[0].progress).toBe(50)
    expect(d.company?.balance).toBe('98850.00') // 100000 − 30000/30 − 150
    expect(d.transactions.map((t) => t.type)).toEqual(['salary', 'operating_expense'])
  })

  it('завершує завдання й повідомляє, що проєкт готовий до здачі', () => {
    tick(d)
    tick(d)
    expect(d.projects[0].tasks[0].status).toBe('done')
    expect(d.projects[0].progress).toBe(100)
    expect(d.notifications.some((n) => n.type === 'project_completed')).toBe(true)
  })

  it('не нараховує прогрес непризначеним завданням', () => {
    d.projects[0].tasks[0].assignee_ids = []
    tick(d)
    expect(d.projects[0].tasks[0].work_done).toBe(0)
  })

  it('нараховує штраф за прострочення 2% бюджету й обмежує 30%', () => {
    d.projects[0].deadline = 0
    const budget = Number(d.contracts[0].budget)
    for (let i = 0; i < 30; i++) tick(d)
    expect(d.penalties[901]).toBe(Math.round(budget * 0.3 * 100))
  })
})
