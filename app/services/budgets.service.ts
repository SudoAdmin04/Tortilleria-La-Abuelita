import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Budget = components['schemas']['BudgetResponseDto']
export type CreateBudget = components['schemas']['CreateBudgetDto']
export type UpdateBudget = components['schemas']['UpdateBudgetDto']
export type BudgetAdjustment = components['schemas']['BudgetAdjustmentResponseDto']
export type CopyBudgets = components['schemas']['CopyBudgetsDto']
export type CopyBudgetsResult = components['schemas']['CopyBudgetsResponseDto']

export interface MonthQuery {
  year: number
  month: number
}

export function listBudgets(params: MonthQuery) {
  return useApi().api<Budget[]>('/budgets', { query: { ...params } })
}

export function createBudget(payload: CreateBudget) {
  return useApi().api<Budget>('/budgets', { method: 'POST', body: payload })
}

export function getBudget(id: string) {
  return useApi().api<Budget>(`/budgets/${id}`)
}

export function updateBudget(id: string, payload: UpdateBudget) {
  return useApi().api<Budget>(`/budgets/${id}`, { method: 'PATCH', body: payload })
}

export function deleteBudget(id: string) {
  return useApi().api<void>(`/budgets/${id}`, { method: 'DELETE' })
}

export function copyBudgets(payload: CopyBudgets) {
  return useApi().api<CopyBudgetsResult>('/budgets/copy', { method: 'POST', body: payload })
}

export function recentAdjustments(days = 14) {
  return useApi().api<BudgetAdjustment[]>('/budgets/adjustments/recent', { query: { days } })
}

export function budgetHistory(id: string) {
  return useApi().api<BudgetAdjustment[]>(`/budgets/${id}/adjustments`)
}
