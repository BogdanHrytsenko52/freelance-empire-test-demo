// Назви полів і значення — пропозиція frontend за ТЗ backend. Остаточні перевіряємо зі Swagger (drf-spectacular).

/** DRF DecimalField віддає суми рядком ("100000.00"). Для відображення, а не для арифметики. */
export type Money = string

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Specialization = 'frontend' | 'backend' | 'fullstack' | 'designer' | 'qa'
export type Level = 'junior' | 'middle' | 'senior'
export type ContractStatus = 'available' | 'negotiating' | 'accepted' | 'completed' | 'failed'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type EventStatus = 'pending' | 'resolved' | 'expired'
export type EventKind = 'positive' | 'negative' | 'neutral'
export type TransactionType = 'contract_payment' | 'salary' | 'operating_expense' | 'penalty' | 'event_reward' | 'event_cost'
export type NotificationType = 'new_event' | 'project_completed' | 'deadline_soon' | 'payout' | 'penalty' | 'new_contract'

export interface Company {
  id: number
  name: string
  balance: Money
  reputation: number // 0–100
  level: number
  completed_contracts: number
  created_at: string
}

export interface EmployeeSkill { skill: string; value: number } // 1–100

export interface Employee {
  id: number
  name: string
  specialization: Specialization
  level: Level
  salary: Money // місячна, ігровий місяць = 30 днів
  productivity: number
  is_available: boolean
  hired_at: string
  skills: EmployeeSkill[]
}

export interface Candidate {
  id: number
  name: string
  specialization: Specialization
  level: Level
  skills: EmployeeSkill[]
  expected_salary: Money
  is_available: boolean
}

export interface Contract {
  id: number
  client: { name: string }
  title: string
  description: string
  budget: Money
  difficulty: number
  deadline: number // граничний ігровий день
  requirements: string
  status: ContractStatus
  created_at: string
  accepted_at: string | null
}

export interface ProjectTask {
  id: number
  title: string
  required_specialization: Specialization
  work_total: number
  work_done: number
  status: TaskStatus
  assignee_ids: number[]
}

export interface Project {
  id: number
  contract: Contract
  status: string // статуси проєкту ще не узгоджені
  progress: number // 0–100, рахує сервер
  quality: number // 0–100, рахує сервер
  deadline: number
  tasks: ProjectTask[]
}

export interface Transaction {
  id: number
  amount: Money // зі знаком: дохід +, витрата −
  type: TransactionType
  description: string
  game_day: number
  created_at: string
}

export interface EventChoice { id: number; text: string }

export interface GameEvent {
  id: number
  title: string
  description: string
  kind: EventKind
  status: EventStatus
  choices: EventChoice[]
  created_at: string
  resolved_at: string | null
}

export interface AppNotification {
  id: number
  title: string
  text: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

export interface LeaderboardEntry {
  place: number
  company_id: number
  name: string
  reputation: number
  balance: Money
  completed_contracts: number
}
