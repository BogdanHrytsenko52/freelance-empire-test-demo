import axios, { AxiosError } from 'axios'
import type { AxiosAdapter } from 'axios'
import type { Contract, Employee, LeaderboardEntry } from '../types'
import { MockDB, MockProject, expandProject, getDB, nextId, nowIso, resetDB, save } from './db'
import { addTx, applyEffect, clamp, computeQuality, notify, progressOf, specFactor } from './engine'
import { fromCents, toCents } from './money'
import { EVENT_TEMPLATES } from './templates'

// Мок-backend на рівні HTTP: справжній api-клієнт та interceptors працюють як із Django.
class HttpError extends Error {
  status: number
  data: unknown
  constructor(status: number, data: unknown) {
    super('mock http error')
    this.status = status
    this.data = data
  }
}
class Created {
  data: unknown
  constructor(data: unknown) {
    this.data = data
  }
}
const fail = (status: number, detail: string) => new HttpError(status, { detail })

interface Ctx {
  db: MockDB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any>
  m: RegExpMatchArray
}
interface Route {
  method: string
  pattern: RegExp
  isPublic: boolean
  handler: (c: Ctx) => unknown
}
const routes: Route[] = []
const on = (method: string, pattern: RegExp, handler: (c: Ctx) => unknown, isPublic = false) =>
  routes.push({ method, pattern, handler, isPublic })

const requireCompany = (db: MockDB) => {
  if (!db.company) throw fail(404, 'Компанію не знайдено')
  return db.company
}
const findById = <T extends { id: number }>(list: T[], id: string | number, what: string): T => {
  const item = list.find((x) => x.id === Number(id))
  if (!item) throw fail(404, `${what} не знайдено`)
  return item
}
const randomToken = (kind: string) => `mock-${kind}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`

// ---------- auth ----------
on('post', /^\/auth\/register\/$/, ({ body }) => {
  const errors: Record<string, string[]> = {}
  for (const f of ['username', 'email', 'password', 'password_confirm']) if (!body[f]) errors[f] = ['Це поле обовʼязкове.']
  if (!errors.password_confirm && body.password !== body.password_confirm) {
    errors.password_confirm = ['Password confirmation does not match.']
  }
  if (Object.keys(errors).length) throw new HttpError(400, errors)
  const d = resetDB() // у моку один гравець: нова реєстрація починає гру з нуля
  d.user = { id: nextId(d), username: body.username, email: body.email, role: 'player', date_joined: nowIso(), is_active: true }
  d.password = body.password
  return new Created({ id: d.user.id, username: d.user.username, email: d.user.email })
}, true)

on('post', /^\/auth\/token\/$/, ({ db, body }) => {
  if (!db.user || db.user.username !== body.username || db.password !== body.password) {
    throw fail(401, 'No active account found with the given credentials')
  }
  return { access: randomToken('access'), refresh: randomToken('refresh') }
}, true)

on('post', /^\/auth\/token\/refresh\/$/, () => ({ access: randomToken('access'), refresh: randomToken('refresh') }), true)
on('post', /^\/auth\/logout\/$/, () => ({}))
on('get', /^\/auth\/me\/$/, ({ db }) => db.user)

// ---------- гра ----------
on('get', /^\/game\/state\/$/, ({ db }) => ({ game_day: db.game_day }))

// ---------- компанія ----------
on('post', /^\/companies\/$/, ({ db, body }) => {
  if (db.company) throw fail(400, 'У вас уже є компанія')
  const name = String(body.name ?? '').trim()
  if (name.length < 3 || name.length > 50) throw new HttpError(400, { name: ['Від 3 до 50 символів'] })
  db.company = { id: 1, name, balance: '100000.00', reputation: 10, level: 1, completed_contracts: 0, created_at: nowIso() }
  return new Created(db.company)
})
on('get', /^\/companies\/me\/$/, ({ db }) => requireCompany(db))
on('patch', /^\/companies\/me\/$/, ({ db, body }) => {
  const company = requireCompany(db)
  if (body.name !== undefined) {
    const name = String(body.name).trim()
    if (name.length < 3 || name.length > 50) throw new HttpError(400, { name: ['Від 3 до 50 символів'] })
    company.name = name // balance, reputation і level ігноруються
  }
  return company
})
on('get', /^\/companies\/me\/finance\/$/, ({ db }) => {
  requireCompany(db)
  let income = 0
  let expenses = 0
  const byDay = new Map<number, { i: number; e: number }>()
  for (const t of db.transactions) {
    const c = toCents(t.amount)
    const row = byDay.get(t.game_day) ?? { i: 0, e: 0 }
    if (c >= 0) { income += c; row.i += c } else { expenses += -c; row.e += -c }
    byDay.set(t.game_day, row)
  }
  const daily = []
  for (let day = Math.max(1, db.game_day - 13); day <= db.game_day; day++) {
    const r = byDay.get(day) ?? { i: 0, e: 0 }
    daily.push({ game_day: day, income: fromCents(r.i), expenses: fromCents(r.e) })
  }
  return { income: fromCents(income), expenses: fromCents(expenses), profit: fromCents(income - expenses), daily }
})

// ---------- працівники ----------
on('get', /^\/employees\/$/, ({ db, params }) =>
  db.employees.filter((e) => !params.specialization || e.specialization === params.specialization))
on('get', /^\/employees\/candidates\/$/, ({ db, params }) =>
  db.candidates.filter((c) => c.is_available && (!params.specialization || c.specialization === params.specialization)))
on('post', /^\/employees\/hire\/$/, ({ db, body }) => {
  const company = requireCompany(db)
  if (toCents(company.balance) < 0) throw fail(400, 'Не можна наймати працівників за наявності боргу')
  const cand = db.candidates.find((c) => c.id === Number(body.candidate_id))
  if (!cand || !cand.is_available) throw fail(400, 'Кандидат недоступний')
  cand.is_available = false
  const productivity = { junior: 0.7, middle: 1, senior: 1.4 }[cand.level]
  const emp: Employee = {
    id: nextId(db), name: cand.name, specialization: cand.specialization, level: cand.level,
    salary: cand.expected_salary, productivity, is_available: true, hired_at: nowIso(), skills: cand.skills,
  }
  db.employees.push(emp)
  return new Created(emp)
})
on('post', /^\/employees\/(\d+)\/fire\/$/, ({ db, m }) => {
  const e = findById(db.employees, m[1], 'Працівника')
  db.employees = db.employees.filter((x) => x.id !== e.id)
  for (const p of db.projects) for (const t of p.tasks) t.assignee_ids = t.assignee_ids.filter((i) => i !== e.id)
  return {}
})

// ---------- контракти та чат ----------
function getChat(db: MockDB, c: Contract) {
  db.chats[c.id] ??= {
    messages: [{
      id: nextId(db), sender: 'npc', created_at: nowIso(),
      text: `Вітаю! Я ${c.client.name}. Готовий обговорити проєкт «${c.title}»: вимоги, бюджет чи терміни.`,
    }],
    proposal: null, negotiations_left: 3, max_message_length: 1000, // AI_MAX_MESSAGE_LENGTH у backend
  }
  return db.chats[c.id]
}

on('get', /^\/contracts\/$/, ({ db }) => db.contracts)
on('get', /^\/contracts\/(\d+)\/$/, ({ db, m }) => findById(db.contracts, m[1], 'Контракт'))
on('get', /^\/contracts\/(\d+)\/chat\/$/, ({ db, m }) => getChat(db, findById(db.contracts, m[1], 'Контракт')))

on('post', /^\/contracts\/(\d+)\/chat\/$/, ({ db, body, m }) => {
  const c = findById(db.contracts, m[1], 'Контракт')
  if (c.status !== 'available' && c.status !== 'negotiating') throw fail(400, 'Переговори за цим контрактом закрито')
  const chat = getChat(db, c)
  const text = String(body.text ?? '').trim()
  if (!text) throw new HttpError(400, { text: ['Повідомлення не може бути порожнім'] })
  if (text.length > chat.max_message_length) throw new HttpError(400, { text: [`Максимум ${chat.max_message_length} символів`] })

  const t = text.toLowerCase()
  let reply: string
  if (/бюдж|ціна|цін|грн|₴|дорого/.test(t)) {
    if (chat.negotiations_left <= 0) {
      reply = 'Ми вже вичерпали переговори щодо умов. Пропоную прийняти поточну пропозицію.'
    } else {
      chat.negotiations_left -= 1
      const cur = Number(chat.proposal?.budget ?? c.budget)
      const next = Math.min(Math.round(Number(c.budget) * 1.25), Math.round((cur * 1.08) / 100) * 100)
      if (next <= cur) {
        reply = 'Це вже мій максимальний бюджет.'
      } else {
        chat.proposal = { budget: next.toFixed(2), deadline: chat.proposal?.deadline ?? c.deadline }
        reply = `Гаразд, можу підняти бюджет до ${next.toLocaleString('uk-UA')} ₴.`
      }
    }
  } else if (/дедлайн|термін|строк|днів/.test(t)) {
    if (chat.negotiations_left <= 0) {
      reply = 'Ми вже вичерпали переговори щодо умов. Пропоную прийняти поточну пропозицію.'
    } else {
      chat.negotiations_left -= 1
      const cur = chat.proposal?.deadline ?? c.deadline
      const next = Math.min(c.deadline + 10, cur + 3)
      if (next <= cur) {
        reply = 'Довше чекати я не можу.'
      } else {
        chat.proposal = { budget: chat.proposal?.budget ?? c.budget, deadline: next }
        reply = `Добре, можемо відсунути дедлайн на ${next - c.deadline} дн.`
      }
    }
  } else if (/вимог|технолог|функці|потрібно/.test(t)) {
    reply = `Основні вимоги: ${c.requirements}`
  } else {
    reply = 'Дякую за запитання! Можемо обговорити вимоги, бюджет або дедлайн.'
  }

  c.status = 'negotiating'
  chat.messages.push({ id: nextId(db), sender: 'player', text, created_at: nowIso() })
  chat.messages.push({ id: nextId(db), sender: 'npc', text: reply, created_at: nowIso() })
  return { ...chat, fallback: false }
})

on('post', /^\/contracts\/(\d+)\/accept\/$/, ({ db, m }) => {
  requireCompany(db)
  const c = findById(db.contracts, m[1], 'Контракт')
  if (c.status !== 'available' && c.status !== 'negotiating') throw fail(400, 'Контракт уже прийнято')
  const plan = db.plans[c.id] ?? { window: 14, tasks: [] }
  const chat = db.chats[c.id]
  const extraDays = chat?.proposal ? chat.proposal.deadline - c.deadline : 0
  if (chat?.proposal) c.budget = chat.proposal.budget // зберігаємо узгоджені умови
  c.deadline = db.game_day + plan.window + extraDays
  c.status = 'accepted'
  c.accepted_at = nowIso()
  const project: MockProject = {
    id: nextId(db), contract_id: c.id, status: 'in_progress', progress: 0, quality: 0, deadline: c.deadline,
    tasks: plan.tasks.map((t) => ({
      id: nextId(db), title: t.title, required_specialization: t.spec, work_total: t.work,
      work_done: 0, status: 'todo' as const, assignee_ids: [] as number[],
    })),
  }
  db.projects.push(project)
  return new Created({ project_id: project.id })
})

// ---------- проєкти ----------
on('get', /^\/projects\/$/, ({ db }) => db.projects.map((p) => expandProject(db, p)))
on('get', /^\/projects\/(\d+)\/$/, ({ db, m }) => expandProject(db, findById(db.projects, m[1], 'Проєкт')))

on('post', /^\/projects\/(\d+)\/assign\/$/, ({ db, body, m }) => {
  const p = findById(db.projects, m[1], 'Проєкт')
  const t = p.tasks.find((x) => x.id === Number(body.task_id))
  const e = db.employees.find((x) => x.id === Number(body.employee_id))
  if (!t) throw fail(404, 'Завдання не знайдено')
  if (!e) throw fail(400, 'Працівника не знайдено у вашій компанії')
  if (p.status !== 'in_progress' || t.status === 'done') throw fail(400, 'Це завдання вже не можна змінювати')
  if (t.assignee_ids.includes(e.id)) throw fail(400, 'Працівника вже призначено на це завдання')
  if (specFactor(e.specialization, t.required_specialization) < 0.65) throw fail(400, 'Спеціалізація працівника не підходить для цього завдання')
  t.assignee_ids.push(e.id)
  return expandProject(db, p)
})

on('post', /^\/projects\/(\d+)\/unassign\/$/, ({ db, body, m }) => {
  const p = findById(db.projects, m[1], 'Проєкт')
  const t = p.tasks.find((x) => x.id === Number(body.task_id))
  if (!t) throw fail(404, 'Завдання не знайдено')
  if (!t.assignee_ids.includes(Number(body.employee_id))) throw fail(400, 'Працівник не призначений на це завдання')
  t.assignee_ids = t.assignee_ids.filter((i) => i !== Number(body.employee_id))
  return expandProject(db, p)
})

on('post', /^\/projects\/(\d+)\/submit\/$/, ({ db, m }) => {
  const company = requireCompany(db)
  const p = findById(db.projects, m[1], 'Проєкт')
  if (p.status !== 'in_progress') throw fail(400, 'Проєкт уже здано')
  if (p.tasks.some((t) => t.status !== 'done')) throw fail(400, 'Не можна здати проєкт, поки не виконано всі завдання')
  const contract = findById(db.contracts, p.contract_id, 'Контракт')
  const quality = computeQuality(db, p)
  p.quality = quality

  if (quality < 60) {
    const t = p.tasks.find((x) => x.required_specialization === 'qa') ?? p.tasks[p.tasks.length - 1]
    t.work_done = Math.floor(t.work_total / 2)
    t.status = 'in_progress'
    p.progress = progressOf(p)
    return {
      accepted: false, needs_rework: true, payout: '0.00', reputation_change: 0,
      message: `Клієнт не прийняв роботу: якість ${quality} нижча за 60. Потрібне доопрацювання.`,
    }
  }

  const budget = toCents(contract.budget)
  const bonus = quality >= 90 ? Math.round(budget * 0.1) : 0
  const penalty = db.penalties[p.id] ?? 0
  addTx(db, budget + bonus, 'contract_payment', `Оплата контракту «${contract.title}»`)
  if (penalty > 0) addTx(db, -penalty, 'penalty', `Штраф за прострочення «${contract.title}»`)
  const late = db.game_day > p.deadline
  const rep = (quality >= 90 ? 5 : 3) - (late ? 3 : 0)
  company.reputation = clamp(company.reputation + rep, 0, 100)
  company.completed_contracts += 1
  company.level = 1 + Math.floor(company.completed_contracts / 3)
  p.status = 'completed'
  contract.status = 'completed'
  const payout = budget + bonus - penalty
  notify(db, 'payout', 'Виплата за контракт', `«${contract.title}»: ${fromCents(payout)} ₴`)
  return {
    accepted: true, needs_rework: false, payout: fromCents(payout), reputation_change: rep,
    message: `Клієнт прийняв роботу (якість ${quality}).${bonus ? ' Додано бонус за якість.' : ''}${penalty ? ' Утримано штраф за прострочення.' : ''}`,
  }
})

// ---------- фінанси, івенти, сповіщення, рейтинг ----------
on('get', /^\/transactions\/$/, ({ db, params }) =>
  db.transactions.filter((t) => !params.type || t.type === params.type).sort((a, b) => b.id - a.id))

on('get', /^\/events\/$/, ({ db }) => db.events.filter((e) => e.status === 'pending'))
on('get', /^\/events\/history\/$/, ({ db }) => db.events.filter((e) => e.status !== 'pending').sort((a, b) => b.id - a.id))
on('post', /^\/events\/(\d+)\/choose\/$/, ({ db, body, m }) => {
  requireCompany(db)
  const ev = findById(db.events, m[1], 'Подію')
  if (ev.status !== 'pending') throw fail(400, 'Рішення вже прийнято або подія завершилась')
  const tpl = EVENT_TEMPLATES.find((t) => t.key === db.eventMeta[ev.id].key)
  const choice = tpl?.choices[Number(body.choice_id) - 1]
  if (!tpl || !choice) throw new HttpError(400, { choice_id: ['Невірний варіант рішення'] })
  ev.outcome = [choice.outcome, ...applyEffect(db, choice.effect, ev.title)]
  ev.status = 'resolved'
  ev.chosen_choice_id = Number(body.choice_id)
  ev.resolved_at = nowIso()
  return ev
})

on('get', /^\/notifications\/$/, ({ db }) => [...db.notifications].sort((a, b) => b.id - a.id))
on('post', /^\/notifications\/(\d+)\/read\/$/, ({ db, m }) => {
  const n = findById(db.notifications, m[1], 'Сповіщення')
  n.is_read = true
  return n
})

on('get', /^\/leaderboard\/$/, ({ db, params }) => {
  const own: LeaderboardEntry[] = db.company
    ? [{ place: 0, company_id: db.company.id, name: db.company.name, reputation: db.company.reputation, balance: db.company.balance, completed_contracts: db.company.completed_contracts }]
    : []
  const key = ['reputation', 'balance', 'completed_contracts'].includes(params.ordering) ? params.ordering : 'reputation'
  const val = (e: LeaderboardEntry) => Number((e as unknown as Record<string, unknown>)[key])
  const sorted = [...db.rivals, ...own].sort((a, b) => val(b) - val(a)).map((e, i) => ({ ...e, place: i + 1 }))
  const size = 5
  const page = Math.max(1, Number(params.page) || 1)
  return {
    count: sorted.length,
    next: page * size < sorted.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results: sorted.slice((page - 1) * size, page * size),
  }
})

// ---------- адаптер Axios ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const HYBRID = import.meta.env.VITE_USE_MOCKS === 'hybrid'

export const mockAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? 'get').toLowerCase()
  const url = (config.url ?? '').split('?')[0]
  // Гібридний режим: /auth/* іде у справжній Django, решта обробляється моками.
  if (HYBRID && url.startsWith('/auth/')) return axios.getAdapter(['xhr', 'http', 'fetch'])(config)
  await sleep(120 + Math.random() * 220)
  const respond = (status: number, data: unknown) => ({
    data, status, statusText: status < 300 ? 'OK' : 'Error', headers: {}, config,
  })
  const failure = (status: number, data: unknown) =>
    new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, undefined, respond(status, data))

  const route = routes.find((r) => r.method === method && r.pattern.test(url))
  if (!route) throw failure(404, { detail: 'Не знайдено' })
  try {
    const db = getDB()
    if (!route.isPublic && !HYBRID) {
      const auth = String(config.headers?.Authorization ?? '')
      if (!auth.startsWith('Bearer mock-access') || !db.user) throw fail(401, 'Authentication credentials were not provided.')
    }
    const body = typeof config.data === 'string' && config.data ? JSON.parse(config.data) : {}
    const result = route.handler({ db, body, params: config.params ?? {}, m: url.match(route.pattern) as RegExpMatchArray })
    save()
    return result instanceof Created ? respond(201, result.data) : respond(200, result)
  } catch (e) {
    if (e instanceof HttpError) throw failure(e.status, e.data)
    throw e
  }
}
