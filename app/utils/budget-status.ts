import type { BadgeProps } from '@nuxt/ui'

export const BUDGET_STATUS_META: Record<string, { label: string, color: BadgeProps['color'] }> = {
  within: { label: 'En orden', color: 'success' },
  near: { label: 'Cerca del límite', color: 'warning' },
  exceeded: { label: 'Excedido', color: 'error' },
  unbudgeted: { label: 'Sin presupuesto', color: 'neutral' },
  met: { label: 'Cumplido', color: 'success' },
  below: { label: 'Por debajo', color: 'info' },
}

export function budgetStatusMeta(status: string | undefined) {
  return BUDGET_STATUS_META[status ?? ''] ?? { label: status ?? '—', color: 'neutral' as const }
}
