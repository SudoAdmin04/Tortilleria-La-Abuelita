import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Overview = components['schemas']['DashboardOverviewResponseDto']
export type Kpis = components['schemas']['DashboardKpisResponseDto']
export type Liquidity = components['schemas']['LiquidityResponseDto']
export type Distribution = components['schemas']['ExpenseDistributionResponseDto']
export type IncomeVsBudget = components['schemas']['IncomeVsBudgetResponseDto']
export type Waterfall = components['schemas']['WaterfallResponseDto']
export type LedgerSummary = components['schemas']['LedgerSummaryResponseDto']
export type CategoryBreakdown = components['schemas']['CategoryBreakdownResponseDto']
export type DebtsSnapshot = components['schemas']['DebtsSnapshotResponseDto']
export type SavingsSnapshot = components['schemas']['SavingsSnapshotResponseDto']

export interface RangeQuery {
  year?: number
  month?: number
  granularity?: 'monthly' | 'quarterly' | 'annual'
  accountId?: string
  paymentMethod?: 'bank_transfer' | 'debit_card' | 'credit_card' | 'cash'
}

/** GET /dashboard/overview — carga inicial (KPIs + donut + barras + waterfall + tablas). */
export function getOverview(params: RangeQuery = {}) {
  return useApi().api<Overview>('/dashboard/overview', { query: { ...params } })
}

export function getKpis(params: RangeQuery = {}) {
  return useApi().api<Kpis>('/dashboard/kpis', { query: { ...params } })
}

export function getLiquidity(params: RangeQuery = {}) {
  return useApi().api<Liquidity>('/dashboard/liquidity', { query: { ...params } })
}

export function getDistribution(params: RangeQuery = {}) {
  return useApi().api<Distribution>('/dashboard/expense-distribution', { query: { ...params } })
}

export function getIncomeVsBudget(params: RangeQuery = {}) {
  return useApi().api<IncomeVsBudget>('/dashboard/income-vs-budget', { query: { ...params } })
}

export function getWaterfall(params: RangeQuery = {}) {
  return useApi().api<Waterfall>('/dashboard/waterfall', { query: { ...params } })
}

export function getIncomeSummary(params: RangeQuery = {}) {
  return useApi().api<LedgerSummary>('/dashboard/income-summary', { query: { ...params } })
}

export function getExpenseSummary(params: RangeQuery = {}) {
  return useApi().api<LedgerSummary>('/dashboard/expense-summary', { query: { ...params } })
}

export function getCategoryBreakdown(params: RangeQuery & { categoryId?: string } = {}) {
  return useApi().api<CategoryBreakdown>('/dashboard/category-breakdown', { query: { ...params } })
}

export function getDebtsSnapshot(params: RangeQuery = {}) {
  return useApi().api<DebtsSnapshot>('/dashboard/debts-snapshot', { query: { ...params } })
}

export function getSavingsSnapshot(params: RangeQuery = {}) {
  return useApi().api<SavingsSnapshot>('/dashboard/savings-snapshot', { query: { ...params } })
}
