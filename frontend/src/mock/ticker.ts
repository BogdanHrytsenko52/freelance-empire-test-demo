import { getDB, save } from './db'
import { tick } from './engine'

let started = false

// У справжній грі 1 реальна година = 1 ігровий день. У моках день триває 10 секунд, щоб було видно прогрес.
export function startMockTicker(intervalMs = 10000) {
  if (started) return
  started = true
  setInterval(() => {
    tick(getDB())
    save()
  }, intervalMs)
}
