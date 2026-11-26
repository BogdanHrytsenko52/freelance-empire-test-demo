// Мок рахує гроші в копійках (цілі числа), щоб уникнути похибок float.
export const toCents = (v: string | number) => Math.round(Number(v) * 100)
export const fromCents = (c: number) => (c / 100).toFixed(2)
