import { api } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import { unwrapList } from '../../api/pagination'
import type { Paginated, Project, SubmitResult } from '../../types'

export async function getProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[] | Paginated<Project>>(ENDPOINTS.projects.list)
  return unwrapList(data)
}

export async function getProject(id: number): Promise<Project> {
  const { data } = await api.get<Project>(ENDPOINTS.projects.detail(id))
  return data
}

export async function assignEmployee(projectId: number, employeeId: number, taskId: number): Promise<Project> {
  const { data } = await api.post<Project>(ENDPOINTS.projects.assign(projectId), { employee_id: employeeId, task_id: taskId })
  return data
}

export async function unassignEmployee(projectId: number, employeeId: number, taskId: number): Promise<Project> {
  const { data } = await api.post<Project>(ENDPOINTS.projects.unassign(projectId), { employee_id: employeeId, task_id: taskId })
  return data
}

export async function submitProject(projectId: number): Promise<SubmitResult> {
  const { data } = await api.post<SubmitResult>(ENDPOINTS.projects.submit(projectId))
  return data
}
