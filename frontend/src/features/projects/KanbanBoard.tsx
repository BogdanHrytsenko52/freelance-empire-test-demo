import { useState } from 'react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import ProgressBar from '../../components/ProgressBar'
import { LEVEL_LABELS, SPECIALIZATION_LABELS, TASK_STATUS_LABELS } from '../../constants/labels'
import type { Employee, ProjectTask, TaskStatus } from '../../types'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done']

interface Props {
  tasks: ProjectTask[]
  employees: Employee[]
  onAssign: (taskId: number, employeeId: number) => void | Promise<void>
  onUnassign: (taskId: number, employeeId: number) => void | Promise<void>
  busy?: boolean
}

// Статуси й прогрес задає лише сервер (симуляція): картки не перетягуються, 100% вручну поставити не можна.
export default function KanbanBoard({ tasks, employees, onAssign, onUnassign, busy }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((status) => {
        const items = tasks.filter((t) => t.status === status)
        return (
          <section key={status} aria-label={TASK_STATUS_LABELS[status]} className="rounded-xl border border-border bg-surface p-3">
            <h3 className="mb-3 flex items-center justify-between text-sm font-semibold">
              {TASK_STATUS_LABELS[status]}
              <Badge>{items.length}</Badge>
            </h3>
            <div className="flex flex-col gap-3">
              {items.length === 0 && <p className="text-xs text-muted">Немає завдань</p>}
              {items.map((t) => (
                <TaskCard key={t.id} task={t} employees={employees} onAssign={onAssign} onUnassign={onUnassign} busy={busy} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function TaskCard({ task, employees, onAssign, onUnassign, busy }: Omit<Props, 'tasks'> & { task: ProjectTask }) {
  const [selected, setSelected] = useState('')
  const pct = task.work_total ? Math.round((100 * task.work_done) / task.work_total) : 0
  const assignees = task.assignee_ids.flatMap((id) => employees.filter((e) => e.id === id))
  const available = employees.filter((e) => !task.assignee_ids.includes(e.id))
  const done = task.status === 'done'

  async function assign() {
    if (!selected) return
    await onAssign(task.id, Number(selected))
    setSelected('')
  }

  return (
    <article aria-label={task.title} className="flex flex-col gap-2 rounded-lg border border-border bg-elevated p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{task.title}</p>
        <Badge tone="primary">{SPECIALIZATION_LABELS[task.required_specialization]}</Badge>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Прогрес</span>
          <span>{pct}% · {Number(task.work_done.toFixed(1))}/{task.work_total}</span>
        </div>
        <ProgressBar value={pct} label={`Прогрес завдання ${task.title}`} />
      </div>

      <div className="flex flex-wrap gap-1">
        {assignees.length === 0 && <span className="text-xs text-muted">Виконавця не призначено</span>}
        {assignees.map((e) => (
          <span key={e.id} className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs">
            {e.name}
            {!done && (
              <button disabled={busy} aria-label={`Зняти ${e.name}`} onClick={() => void onUnassign(task.id, e.id)} className="text-muted hover:text-danger">×</button>
            )}
          </span>
        ))}
      </div>

      {!done && (
        <div className="flex gap-2">
          <select
            aria-label={`Призначити на ${task.title}`}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Оберіть працівника</option>
            {available.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({SPECIALIZATION_LABELS[e.specialization]}, {LEVEL_LABELS[e.level]})</option>
            ))}
          </select>
          <Button variant="ghost" className="!px-3 !py-1.5 text-xs" disabled={!selected || busy} onClick={() => void assign()}>Призначити</Button>
        </div>
      )}
    </article>
  )
}
