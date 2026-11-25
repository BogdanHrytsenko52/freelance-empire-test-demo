import { describe, it, expect } from 'vitest'
import { getFieldErrors, toApiError } from './client'
import { unwrapList } from './pagination'

const axiosErr = (status?: number, data?: unknown) => ({
  isAxiosError: true,
  message: 'fail',
  response: status ? { status, data } : undefined,
})

describe('toApiError', () => {
  it('бере повідомлення з detail', () => {
    expect(toApiError(axiosErr(400, { detail: 'Погано' })).message).toBe('Погано')
  })
  it('бере повідомлення з non_field_errors', () => {
    expect(toApiError(axiosErr(400, { non_field_errors: ['Невірно'] })).message).toBe('Невірно')
  })
  it('повідомляє про ліміт запитів (429)', () => {
    expect(toApiError(axiosErr(429, { detail: 'Request was throttled' })).message).toMatch(/Забагато запитів/)
  })
  it('повідомляє, що сервер недоступний', () => {
    expect(toApiError(axiosErr()).message).toMatch(/Сервер недоступний/)
  })
})

describe('getFieldErrors', () => {
  it('повертає перше повідомлення кожного поля і пропускає non_field_errors', () => {
    const err = { message: '', details: { email: ['Зайнятий', 'x'], non_field_errors: ['y'], detail: 'z' } }
    expect(getFieldErrors(err)).toEqual({ email: 'Зайнятий' })
  })
})

describe('unwrapList', () => {
  it('приймає масив і пагіновану відповідь', () => {
    expect(unwrapList([1, 2])).toEqual([1, 2])
    expect(unwrapList({ count: 1, next: null, previous: null, results: [3] })).toEqual([3])
  })
})
