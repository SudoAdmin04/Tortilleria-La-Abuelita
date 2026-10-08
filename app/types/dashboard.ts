import type { components } from '~/types/api'

export type DashboardReport = components['schemas']['DashboardResponseDto']
export type BudgetLine = components['schemas']['BudgetLineResponseDto']
export type DistributionItem = components['schemas']['DistributionItemResponseDto']

/** `totals` viene como objeto genérico: forma real verificada contra el backend. */
export interface DashboardTotals {
  income: number
  incomeBudget: number
  incomeVariance: number
  incomeExecutionRate: number | null
  expense: number
  expenseBudget: number
  expenseVariance: number
  expenseExecutionRate: number | null
  net: number
  isDeficit: boolean
  saved: number
  debtPayments: number
}

export interface DashboardAccountItem {
  id: string
  name: string
  type: string
  isPrimary?: boolean
  balance: number
}

/** `accounts` viene como objeto genérico: forma real verificada contra el backend. */
export interface DashboardAccounts {
  items: DashboardAccountItem[]
  liquid: number
  total: number
}

export interface DashboardLiabilities {
  payable: number
  receivable: number
}

/** Paso del waterfall: `type` es increase | decrease | total. */
export interface WaterfallStep {
  label: string
  type: 'increase' | 'decrease' | 'total' | string
  amount: number
  start: number
  end: number
}

export const EMPTY_TOTALS: DashboardTotals = {
  income: 0,
  incomeBudget: 0,
  incomeVariance: 0,
  incomeExecutionRate: null,
  expense: 0,
  expenseBudget: 0,
  expenseVariance: 0,
  expenseExecutionRate: null,
  net: 0,
  isDeficit: false,
  saved: 0,
  debtPayments: 0,
}

export const EMPTY_ACCOUNTS: DashboardAccounts = { items: [], liquid: 0, total: 0 }
