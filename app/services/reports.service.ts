import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Dashboard = components['schemas']['DashboardResponseDto']
export type BudgetOverview = components['schemas']['BudgetOverviewResponseDto']
export type Analytics = components['schemas']['AnalyticsResponseDto']

/** GET /reports/dashboard?year=&month= — resumen ejecutivo (mes actual por defecto). */
export function getDashboard(params?: { year?: number, month?: number }) {
  return useApi().api<Dashboard>('/reports/dashboard', { query: { ...(params ?? {}) } })
}

/** GET /reports/budget-overview?year=&month= — presupuesto vs real. */
export function getBudgetOverview(params?: { year?: number, month?: number }) {
  return useApi().api<BudgetOverview>('/reports/budget-overview', { query: { ...(params ?? {}) } })
}

/** GET /reports/analytics?months=&savingsTargetPercent= — cashflow, KPIs y alertas. */
export function getAnalytics(params?: { months?: number, savingsTargetPercent?: number }) {
  return useApi().api<Analytics>('/reports/analytics', { query: { ...(params ?? {}) } })
}
