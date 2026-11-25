import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost'
}

export default function Button({ loading, variant = 'primary', children, disabled, className = '', ...rest }: Props) {
  const styles =
    variant === 'primary'
      ? 'bg-primary text-white hover:bg-primary-hover'
      : 'bg-transparent text-muted hover:bg-elevated hover:text-text'
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {loading ? 'Зачекайте…' : children}
    </button>
  )
}
