import type { NotificationType, Specialization, TransactionType } from '../types'
import { MockDB, MockProject, addContract, nextId, nowIso } from './db'
import { fromCents, toCents } from './money'
import { CONTRACT_TEMPLATES, EVENT_TEMPLATES, EventEffectDef } from './templates'

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function notify(d: MockDB, type: NotificationType, title: string, text: string) {
  d.notifications.push({ id: nextId(d), type, title, text, is_read: false, created_at: nowIso() })
}

// Усі зміни балансу проходять тут і створюють Transaction (як вимагає ТЗ backend).
export function addTx(d: MockDB, cents: number, type: TransactionType, description: string) {
  if (!d.company) return
  d.transactions.push({ id: nextId(d), amount: fromCents(cents), type, description, game_day: d.game_day, created_at: nowIso() })
  d.company.balance = fromCents(toCents(d.company.balance) + cents)
}

const ADJACENT: Record<Specialization, Specialization[]> = {
  frontend: ['fullstack', 'designer'],
  backend: ['fullstack'],
  fullstack: ['frontend', 'backend'],
  designer: ['frontend'],
  qa: [],
}

export function specFactor(emp: Specialization, task: Specialization): number {
  if (emp === task) return 1
  return ADJACENT[emp].includes(task) ? 0.65 : 0.4
}

export function progressOf(p: MockProject): number {
  const total = p.tasks.reduce((s, t) => s + t.work_total, 0)
  const done = p.tasks.reduce((s, t) => s + t.work_done, 0)
  return total ? Math.round((100 * done) / total) : 0
}

export function computeQuality(d: MockDB, p: MockProject): number {
  const ids = new Set(p.tasks.flatMap((t) => t.assignee_ids))
  const team = d.employees.filter((e) => ids.has(e.id))
  let q = 45
  const qaTask = p.tasks.find((t) => t.required_specialization === 'qa')
  if (qaTask?.status === 'done') {
    const qaTeam = qaTask.assignee_ids.flatMap((id) => d.employees.filter((e) => e.id === id))
    q += qaTeam.some((e) => e.specialization === 'qa') ? 25 : 10
  }
  if (team.some((e) => e.level === 'senior')) q += 20
  else if (team.some((e) => e.level === 'middle')) q += 10
  return clamp(q, 0, 100)
}

export function applyEffect(d: MockDB, effect: EventEffectDef, title: string): string[] {
  const out: string[] = []
  const company = d.company
  if (!company) return out
  if (effect.balance) {
    addTx(d, effect.balance * 100, effect.balance > 0 ? 'event_reward' : 'event_cost', title)
    out.push(`Баланс: ${effect.balance > 0 ? '+' : '−'}${Math.abs(effect.balance).toLocaleString('uk-UA')} ₴`)
  }
  if (effect.reputation) {
    company.reputation = clamp(company.reputation + effect.reputation, 0, 100)
    out.push(`Репутація: ${effect.reputation > 0 ? '+' : '−'}${Math.abs(effect.reputation)}`)
  }
  if (effect.urgentContract) {
    const base = CONTRACT_TEMPLATES[3]
    addContract(d, { ...base, title: `Термінове: ${base.title}`, budget: Math.round(base.budget * 1.5), days: 8 })
    out.push('На біржу додано термінове замовлення')
  }
  return out
}

// Один ігровий день: прогрес завдань, штрафи, зарплати, івенти, нові контракти.
export function tick(d: MockDB) {
  d.game_day += 1
  const company = d.company
  if (!company) return
  const day = d.game_day

  // Навантаження: один працівник ділить продуктивність між завданнями.
  const load = new Map<number, number>()
  for (const p of d.projects) {
    if (p.status !== 'in_progress') continue
    for (const t of p.tasks) {
      if (t.status === 'done') continue
      for (const id of t.assignee_ids) load.set(id, (load.get(id) ?? 0) + 1)
    }
  }

  for (const p of d.projects) {
    if (p.status !== 'in_progress') continue
    const contract = d.contracts.find((c) => c.id === p.contract_id)
    const title = contract?.title ?? 'Проєкт'

    for (const t of p.tasks) {
      if (t.status === 'done') continue
      let work = 0
      for (const id of t.assignee_ids) {
        const e = d.employees.find((x) => x.id === id)
        if (e) work += (e.productivity / (load.get(id) ?? 1)) * specFactor(e.specialization, t.required_specialization)
      }
      if (work > 0) {
        t.work_done = Math.min(t.work_total, Math.round((t.work_done + work) * 10) / 10)
        t.status = t.work_done >= t.work_total ? 'done' : 'in_progress'
      }
    }

    const wasComplete = p.progress >= 100
    p.progress = progressOf(p)
    p.quality = computeQuality(d, p)
    if (p.progress >= 100 && !wasComplete) notify(d, 'project_completed', 'Проєкт готовий до здачі', title)

    if (day > p.deadline && contract) {
      const budget = toCents(contract.budget)
      const cur = d.penalties[p.id] ?? 0
      const add = Math.min(Math.round(budget * 0.02), Math.round(budget * 0.3) - cur) // 2% за день, максимум 30%
      if (add > 0) {
        d.penalties[p.id] = cur + add
        if (cur === 0) company.reputation = clamp(company.reputation - 1, 0, 100)
        notify(d, 'penalty', 'Прострочення дедлайну', `«${title}»: штраф ${fromCents(add)} ₴ буде утримано під час здачі`)
      }
    } else if (p.deadline - day === 2) {
      notify(d, 'deadline_soon', 'Наближається дедлайн', `«${title}»: залишилось 2 дні`)
    }
  }

  // Зарплати (місячна / 30) та операційні витрати.
  const salary = d.employees.reduce((s, e) => s + Math.round(toCents(e.salary) / 30), 0)
  if (salary > 0) addTx(d, -salary, 'salary', `Зарплати за день ${day}`)
  addTx(d, -15000, 'operating_expense', `Операційні витрати за день ${day}`)

  // Івенти: життєвий цикл і генерація (шанс 15%, не більше 2 активних).
  for (const e of d.events) {
    if (e.status === 'pending' && day - d.eventMeta[e.id].day >= 5) {
      e.status = 'expired'
      e.resolved_at = nowIso()
    }
  }
  const active = d.events.filter((e) => e.status === 'pending')
  if (active.length < 2 && Math.random() < 0.15) {
    const used = new Set(active.map((e) => d.eventMeta[e.id].key))
    const pool = EVENT_TEMPLATES.filter((t) => !used.has(t.key) && (!t.needsEmployees || d.employees.length > 0))
    if (pool.length) {
      const t = pool[Math.floor(Math.random() * pool.length)]
      const id = nextId(d)
      d.events.push({
        id, title: t.title, description: t.description, kind: t.kind, status: 'pending',
        choices: t.choices.map((c, i) => ({ id: i + 1, text: c.text })),
        created_at: nowIso(), resolved_at: null, chosen_choice_id: null, outcome: [],
      })
      d.eventMeta[id] = { key: t.key, day }
      notify(d, 'new_event', 'Нова подія', t.title)
    }
  }

  // Нові контракти на біржі.
  if (day % 3 === 0 && d.contracts.filter((c) => c.status === 'available').length < 6) {
    const c = addContract(d, CONTRACT_TEMPLATES[d.seq % CONTRACT_TEMPLATES.length])
    notify(d, 'new_contract', 'Новий контракт', c.title)
  }
}
