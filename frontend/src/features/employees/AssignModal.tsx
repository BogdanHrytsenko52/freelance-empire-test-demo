import { useState } from 'react'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import { ErrorState } from '../../components/PageState'
import Select from '../../components/Select'
import { useToast } from '../../components/Toast'
import { toApiError } from '../../api/client'
import { useResource } from '../../hooks/useResource'
import type { Employee } from '../../types'
import { assignEmployee, getProjects } from '../projects/projectsApi'

// Призначення працівника на завдання. Само API належить проєктам (POST /projects/{id}/assign/).
export default function AssignModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const toast = useToast()
  const projects = useResource(getProjects)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const options = (projects.data ?? [])
    .filter((p) => p.status === 'in_progress')
    .flatMap((p) =>
      p.tasks
        .filter((t) => t.status !== 'done' && !t.assignee_ids.includes(employee.id))
        .map((t) => ({ value: `${p.id}:${t.id}`, label: `${p.contract.title} — ${t.title}` })),
    )

  async function submit() {
    const [projectId, taskId] = value.split(':').map(Number)
    setSaving(true)
    try {
      await assignEmployee(projectId, employee.id, taskId)
      toast.success(`${employee.name} призначено на завдання`)
      onClose()
    } catch (e) {
      toast.error(toApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Призначити: ${employee.name}`} onClose={onClose}>
      {projects.loading && !projects.data ? (
        <Loading />
      ) : projects.error && !projects.data ? (
        <ErrorState message={projects.error} onRetry={() => void projects.reload()} />
      ) : options.length === 0 ? (
        <p className="text-sm text-muted">Немає вільних завдань в активних проєктах.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Select
            label="Завдання"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            options={[{ value: '', label: 'Оберіть завдання' }, ...options]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Скасувати</Button>
            <Button disabled={!value} loading={saving} onClick={() => void submit()}>Призначити</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
