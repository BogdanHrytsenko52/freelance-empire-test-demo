import { describe, it, expect } from 'vitest'
import { validateLogin, validateRegister } from './validation'

describe('validateLogin', () => {
  it('вимагає імʼя користувача і пароль', () => {
    expect(validateLogin({ username: '', password: '' })).toEqual({
      username: 'Введіть імʼя користувача',
      password: 'Введіть пароль',
    })
  })
  it('приймає коректні дані', () => {
    expect(validateLogin({ username: 'player_1', password: 'x' })).toEqual({})
  })
})

describe('validateRegister', () => {
  const ok = { username: 'player_1', email: 'a@b.co', password: 'secret123', confirm: 'secret123' }
  it('приймає коректні дані', () => expect(validateRegister(ok)).toEqual({}))
  it('перевіряє короткий пароль і склад пароля', () => {
    expect(validateRegister({ ...ok, password: 'short', confirm: 'short' }).password).toBe('Мінімум 8 символів')
    expect(validateRegister({ ...ok, password: 'onlyletters', confirm: 'onlyletters' }).password).toBe('Потрібні літери та цифри')
  })
  it('перевіряє збіг паролів', () => {
    expect(validateRegister({ ...ok, confirm: 'other123' }).confirm).toBe('Паролі не збігаються')
  })
  it('перевіряє імʼя користувача', () => {
    expect(validateRegister({ ...ok, username: 'ab' }).username).toBe('Від 3 до 30 символів')
    expect(validateRegister({ ...ok, username: 'bad name' }).username).toBe('Лише латиниця, цифри та _')
  })
})
