import type { SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
  hideLabel?: boolean
}

export default function Select({ label, options, hideLabel, className = '', id, ...rest }: Props) {
  const selectId = id ?? `select-${label}`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className={hideLabel ? 'sr-only' : 'text-sm text-muted'}>{label}</label>
      <select id={selectId} className={`rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary ${className}`} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
