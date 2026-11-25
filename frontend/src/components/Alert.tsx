import type { ReactNode } from 'react'

export default function Alert({ type = 'error', children }: { type?: 'error' | 'success'; children: ReactNode }) {
  const color = type === 'error' ? 'border-danger/40 bg-danger/10 text-danger' : 'border-success/40 bg-success/10 text-success'
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${color}`}>
      {children}
    </div>
  )
}
