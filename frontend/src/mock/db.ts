import type {
  AppNotification, Candidate, ChatState, Company, Contract, Employee, GameEvent,
  LeaderboardEntry, Level, Project, Specialization, Transaction, User,
} from '../types'
import { fromCents } from './money'
import { CONTRACT_TEMPLATES } from './templates'
import type { ContractTemplate, TaskPlan } from './templates'

export interface MockProject extends Omit<Project, 'contract'> {
  contract_id: number
}

export interface MockDB {
  seq: number
  user: User | null
  password: string
  company: Company | null
  game_day: number
  employees: Employee[]
  candidates: Candidate[]
  contracts: Contract[]
  plans: Record<string, { window: number; tasks: TaskPlan[] }>
  projects: MockProject[]
  transactions: Transaction[]
  events: GameEvent[]
  eventMeta: Record<string, { key: string; day: number }>
  notifications: AppNotification[]
  chats: Record<string, ChatState>
  rivals: LeaderboardEntry[]
  penalties: Record<string, number>
}

export const PRODUCTIVITY: Record<Level, number> = { junior: 0.7, middle: 1.0, senior: 1.4 }
const SALARY: Record<Level, number> = { junior: 18000, middle: 32000, senior: 52000 }
const SKILL_BASE: Record<Level, number> = { junior: 45, middle: 65, senior: 85 }
const SKILLS: Record<Specialization, string[]> = {
  frontend: ['React', 'TypeScript', 'CSS'],
  backend: ['Python', 'Django', 'SQL'],
  fullstack: ['React', 'Django', 'Git'],
  designer: ['Figma', 'UX', 'Prototyping'],
  qa: ['Manual testing', 'Automation', 'API testing'],
}

const CANDIDATES: [string, Specialization, Level][] = [
  ['Олена Коваль', 'frontend', 'middle'],
  ['Максим Шевчук', 'backend', 'senior'],
  ['Ірина Мельник', 'designer', 'middle'],
  ['Андрій Бондаренко', 'qa', 'junior'],
  ['Софія Ткаченко', 'fullstack', 'middle'],
  ['Дмитро Кравченко', 'frontend', 'junior'],
  ['Наталія Олійник', 'backend', 'middle'],
  ['Богдан Лисенко', 'qa', 'middle'],
  ['Юлія Поліщук', 'designer', 'junior'],
  ['Тарас Савченко', 'fullstack', 'senior'],
]

const RIVALS: [string, number, string, number][] = [
  ['PixelForge', 72, '845000.00', 14],
  ['CodeNest', 65, '610000.00', 11],
  ['Bytewave', 58, '520000.00', 9],
  ['Studio Nova', 51, '390000.00', 7],
  ['DevHarbor', 44, '310000.00', 6],
  ['LogicLeaf', 37, '240000.00', 4],
  ['Frontline Lab', 29, '180000.00', 3],
  ['Kyiv Pixels', 21, '130000.00', 2],
]

export const nextId = (d: MockDB) => ++d.seq
export const nowIso = () => new Date().toISOString()

export function addContract(d: MockDB, tpl: ContractTemplate): Contract {
  const id = nextId(d)
  const window = tpl.days + 4
  const c: Contract = {
    id,
    client: { name: tpl.client },
    title: tpl.title,
    description: tpl.description,
    budget: fromCents(tpl.budget * 100),
    difficulty: tpl.difficulty,
    deadline: d.game_day + window, // орієнтовний граничний день; після прийняття перераховується
    requirements: tpl.requirements,
    status: 'available',
    created_at: nowIso(),
    accepted_at: null,
  }
  d.contracts.push(c)
  d.plans[id] = { window, tasks: tpl.plan }
  return c
}

function seed(): MockDB {
  const d: MockDB = {
    seq: 1, user: null, password: '', company: null, game_day: 1,
    employees: [], candidates: [], contracts: [], plans: {}, projects: [], transactions: [],
    events: [], eventMeta: {}, notifications: [], chats: {}, rivals: [], penalties: {},
  }
  CONTRACT_TEMPLATES.slice(0, 6).forEach((t) => addContract(d, t))
  CANDIDATES.forEach(([name, specialization, level], i) => {
    d.candidates.push({
      id: nextId(d),
      name,
      specialization,
      level,
      skills: SKILLS[specialization].map((skill, k) => ({ skill, value: Math.min(100, SKILL_BASE[level] + ((i + k * 3) % 10)) })),
      expected_salary: fromCents((SALARY[level] + i * 500) * 100),
      is_available: true,
    })
  })
  d.rivals = RIVALS.map(([name, reputation, balance, completed], i) => ({
    place: 0, company_id: 9000 + i, name, reputation, balance, completed_contracts: completed,
  }))
  return d
}

const KEY = 'fe_mock_db_v1'
let db: MockDB | null = null

export function getDB(): MockDB {
  if (!db) {
    try {
      const raw = localStorage.getItem(KEY)
      db = raw ? (JSON.parse(raw) as MockDB) : seed()
    } catch {
      db = seed()
    }
  }
  return db
}

export function save() {
  if (!db) return
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* сховище недоступне, працюємо лише в памʼяті */
  }
}

export function resetDB(): MockDB {
  db = seed()
  save()
  return db
}

export function expandProject(d: MockDB, p: MockProject): Project {
  const contract = d.contracts.find((c) => c.id === p.contract_id) as Contract
  return { ...p, contract } as Project
}
