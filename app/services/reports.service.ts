import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Dashboard = components['schemas']['DashboardResponseDto']
export type BudgetOverview = components['schemas']['BudgetOverviewResponseDto']
export type Analytics = components['schemas']['AnalyticsResponseDto']

export interface AnalyticsQuery {
  /** Año del periodo de cierre (defecto actual). */
  year?: number
  /** Mes del periodo de cierre 1-12 (defecto actual). */
  month?: number
  /** Cantidad de meses de historial, 2-60 (defecto 6). */
  months?: number
  /** Meta de tasa de ahorro % del ingreso, 0-100 (defecto 15). */
  savingsTargetPercent?: number
}

/** Punto mensual del cashflow (`period: 'YYYY-MM'`). */
export interface AnalyticsCashflowPoint {
  period: string
  income: number
  expense: number
  net: number
  saved: number
  budgetExpense: number
}

export interface AnalyticsKpis {
  savingsRate: number | null
  savingsTargetPercent: number
  savingsGap: number
  liquid: number
  averageMonthlyExpense: number
  runwayMonths: number
  expenseDeviation: number
  expenseMoM: number | null
  averageIncome: number
}

export interface AnalyticsLeakageItem {
  categoryId: string
  name: string
  actual: number
  budget: number | null
  variance: number
  percentOfExpense: number
  status: string
}

export interface AnalyticsAlert {
  categoryId: string
  title: string
  severity: 'moderate' | 'high' | string
  actual: number
  budget: number | null
  overspend: number
}

export function getDashboard(params?: { year?: number, month?: number }) {
  return useApi().api<Dashboard>('/reports/dashboard', { query: { ...(params ?? {}) } })
}

export function getBudgetOverview(params?: { year?: number, month?: number }) {
  return useApi().api<BudgetOverview>('/reports/budget-overview', { query: { ...(params ?? {}) } })
}

export function getAnalytics(params?: AnalyticsQuery) {
  return useApi().api<Analytics>('/reports/analytics', { query: { ...(params ?? {}) } })
}
