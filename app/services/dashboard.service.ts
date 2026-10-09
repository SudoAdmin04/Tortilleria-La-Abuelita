import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Overview = components['schemas']['DashboardOverviewResponseDto']
export type Kpis = components['schemas']['DashboardKpisResponseDto']
export type NetKpi = components['schemas']['NetBalanceKpiDto']
export type TotalKpi = components['schemas']['TotalKpiDto']
export type Liquidity = components['schemas']['LiquidityResponseDto']
export type LiquidityAccount = components['schemas']['LiquidityAccountDto']
export type Distribution = components['schemas']['ExpenseDistributionResponseDto']
export type DistributionSlice = components['schemas']['ExpenseDistributionItemDto']
export type IncomeVsBudget = components['schemas']['IncomeVsBudgetResponseDto']
export type IncomeBarItem = components['schemas']['IncomeBarItemDto']
export type Waterfall = components['schemas']['WaterfallResponseDto']
export type WaterfallStep = components['schemas']['WaterfallStepDto']
export type LedgerSummary = components['schemas']['LedgerSummaryResponseDto']
export type LedgerRow = components['schemas']['DashboardSummaryRowDto']
export type CategoryBreakdown = components['schemas']['CategoryBreakdownResponseDto']
export type CategoryBreakdownItem = components['schemas']['CategoryBreakdownItemDto']
export type DebtsSnapshot = components['schemas']['DebtsSnapshotResponseDto']
export type SavingsSnapshot = components['schemas']['SavingsSnapshotResponseDto']

export type Granularity = 'monthly' | 'quarterly' | 'annual'
export type MetodoPago = 'bank_transfer' | 'debit_card' | 'credit_card' | 'cash'

export interface RangeQuery {
  year?: number
  month?: number
  granularity?: Granularity
  accountId?: string
  paymentMethod?: MetodoPago
}

export interface BreakdownQuery extends RangeQuery {
  categoryId?: string
}

function query(params: RangeQuery | BreakdownQuery) {
  return { query: { ...params } }
}

export function getOverview(params: RangeQuery = {}) {
  return useApi().api<Overview>('/dashboard/overview', query(params))
}

export function getKpis(params: RangeQuery = {}) {
  return useApi().api<Kpis>('/dashboard/kpis', query(params))
}

export function getLiquidity(params: RangeQuery = {}) {
  return useApi().api<Liquidity>('/dashboard/liquidity', query(params))
}

export function getDistribution(params: RangeQuery = {}) {
  return useApi().api<Distribution>('/dashboard/expense-distribution', query(params))
}

export function getIncomeVsBudget(params: RangeQuery = {}) {
  return useApi().api<IncomeVsBudget>('/dashboard/income-vs-budget', query(params))
}

export function getWaterfall(params: RangeQuery = {}) {
  return useApi().api<Waterfall>('/dashboard/waterfall', query(params))
}

export function getIncomeSummary(params: RangeQuery = {}) {
  return useApi().api<LedgerSummary>('/dashboard/income-summary', query(params))
}

export function getExpenseSummary(params: RangeQuery = {}) {
  return useApi().api<LedgerSummary>('/dashboard/expense-summary', query(params))
}

export function getCategoryBreakdown(params: BreakdownQuery = {}) {
  return useApi().api<CategoryBreakdown>('/dashboard/category-breakdown', query(params))
}

export function getDebtsSnapshot(params: RangeQuery = {}) {
  return useApi().api<DebtsSnapshot>('/dashboard/debts-snapshot', query(params))
}

export function getSavingsSnapshot(params: RangeQuery = {}) {
  return useApi().api<SavingsSnapshot>('/dashboard/savings-snapshot', query(params))
}
