export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function describeDeadline(deadline: number, today?: number): string {
  if (today === undefined) return `до дня ${deadline}`
  const left = deadline - today
  if (left < 0) return `прострочено на ${-left} дн.`
  if (left === 0) return 'сьогодні'
  return `залишилось ${left} дн.`
}

export const difficultyStars = (n: number) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n))
