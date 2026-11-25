const fmt = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 })

/** Лише для відображення. Фінансові розрахунки виконує сервер. */
export function formatMoney(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(n) ? `${fmt.format(n)} ₴` : '—'
}
