import type { ContractStatus, EventKind, Level, NotificationType, Specialization, TaskStatus, TransactionType } from '../types'

export const SPECIALIZATION_LABELS: Record<Specialization, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Fullstack',
  designer: 'Designer',
  qa: 'QA',
}
export const LEVEL_LABELS: Record<Level, string> = { junior: 'Junior', middle: 'Middle', senior: 'Senior' }
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  available: 'Доступний',
  negotiating: 'Переговори',
  accepted: 'Прийнято',
  completed: 'Завершено',
  failed: 'Провалено',
}
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
export const EVENT_KIND_LABELS: Record<EventKind, string> = { positive: 'Позитивна', negative: 'Негативна', neutral: 'Нейтральна' }
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  contract_payment: 'Виплата за контракт',
  salary: 'Зарплата',
  operating_expense: 'Операційні витрати',
  penalty: 'Штраф',
  event_reward: 'Винагорода за івент',
  event_cost: 'Витрата через івент',
}
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  new_event: 'Новий івент',
  project_completed: 'Проєкт завершено',
  deadline_soon: 'Наближається дедлайн',
  payout: 'Виплата',
  penalty: 'Штраф',
  new_contract: 'Новий контракт',
}
