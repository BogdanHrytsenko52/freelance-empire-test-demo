export function validateCompanyName(name: string): string | undefined {
  const n = name.trim()
  if (!n) return 'Введіть назву компанії'
  if (n.length < 3 || n.length > 50) return 'Від 3 до 50 символів'
  return undefined
}
