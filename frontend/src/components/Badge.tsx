import type { ReactNode } from 'react'

const TONES = {
  default: 'bg-elevated text-muted',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
}
export type Tone = keyof typeof TONES

export default function Badge({ tone = 'default', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>
}
