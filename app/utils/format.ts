export function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function formatMoney(value: number | null | undefined, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num(value))
}

export function formatCompact(value: number | null | undefined, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num(value))
}

export function formatExecution(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return '—'
  return `${rate.toLocaleString('es-MX', { maximumFractionDigits: 1 })}%`
}

export function monthYearLabel(year: number, month: number): string {
  const label = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export function formatVariance(value: number | null | undefined, currency = 'MXN'): string {
  const v = num(value)
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sign}${formatMoney(Math.abs(v), currency)}`
}
