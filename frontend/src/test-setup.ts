import '@testing-library/jest-dom/vitest'

// Node 25+ додає глобальний localStorage, який без файлу сховища повертає undefined
// і перекриває localStorage з jsdom. Підставляємо простий in-memory Storage,
// щоб тести не залежали від версії Node.
function createStorage(): Storage {
  let store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => {
      store = new Map()
    },
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key)
    },
    setItem: (key, value) => {
      store.set(key, String(value))
    },
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  if (typeof globalThis[name]?.clear !== 'function') {
    Object.defineProperty(globalThis, name, { value: createStorage(), configurable: true, writable: true })
  }
}
