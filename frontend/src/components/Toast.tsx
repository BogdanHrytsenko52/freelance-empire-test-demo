import { ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

interface ToastItem { id: number; type: 'success' | 'error'; text: string }
interface ToastApi { success: (text: string) => void; error: (text: string) => void }

// Без провайдера (наприклад, у тестах) сповіщення просто ігноруються.
const ToastContext = createContext<ToastApi>({ success: () => {}, error: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const push = useCallback((type: ToastItem['type'], text: string) => {
    const id = ++counter.current
    setItems((list) => [...list, { id, type, text }])
    setTimeout(() => setItems((list) => list.filter((x) => x.id !== id)), 4000)
  }, [])

  const api = useMemo<ToastApi>(() => ({ success: (t) => push('success', t), error: (t) => push('error', t) }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`rounded-lg border px-3 py-2 text-sm shadow-lg ${
              t.type === 'error' ? 'border-danger/40 bg-surface text-danger' : 'border-success/40 bg-surface text-success'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
