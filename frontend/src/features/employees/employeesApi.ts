import { api } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import { unwrapList } from '../../api/pagination'
import type { Candidate, Employee, Paginated, Specialization } from '../../types'

const params = (specialization?: Specialization) => (specialization ? { specialization } : undefined)

export async function getEmployees(specialization?: Specialization): Promise<Employee[]> {
  const { data } = await api.get<Employee[] | Paginated<Employee>>(ENDPOINTS.employees.list, { params: params(specialization) })
  return unwrapList(data)
}

export async function getCandidates(specialization?: Specialization): Promise<Candidate[]> {
  const { data } = await api.get<Candidate[] | Paginated<Candidate>>(ENDPOINTS.employees.candidates, { params: params(specialization) })
  return unwrapList(data)
}

export async function hireCandidate(candidateId: number): Promise<Employee> {
  const { data } = await api.post<Employee>(ENDPOINTS.employees.hire, { candidate_id: candidateId })
  return data
}

export async function fireEmployee(id: number): Promise<void> {
  await api.post(ENDPOINTS.employees.fire(id))
}
