import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Budget = components['schemas']['BudgetResponseDto']
export type CreateBudget = components['schemas']['CreateBudgetDto']
export type UpdateBudget = components['schemas']['UpdateBudgetDto']
export type BudgetAdjustment = components['schemas']['BudgetAdjustmentResponseDto']
export type CopyBudgets = components['schemas']['CopyBudgetsDto']
export type CopyBudgetsResult = components['schemas']['CopyBudgetsResponseDto']
export type BudgetStats = components['schemas']['BudgetStatsResponseDto']
export type BudgetComparison = components['schemas']['BudgetComparisonResponseDto']
export type BudgetComparisonItem = components['schemas']['BudgetComparisonItemDto']

export interface MonthQuery {
  year: number
  month: number
}

/**
 * El backend unifica las respuestas de lista como `{ message, items: [...] }`
 * (ver TransformInterceptor). Desenvuelve al arreglo real.
 */
function unwrapList<T>(res: any): T[] {
  if (Array.isArray(res)) return res as T[]
  if (Array.isArray(res?.items)) return res.items as T[]
  if (Array.isArray(res?.data)) return res.data as T[]
  return []
}

export async function listBudgets(params: MonthQuery): Promise<Budget[]> {
  const res = await useApi().api<any>('/budgets', { query: { ...params } })
  return unwrapList<Budget>(res)
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

export async function recentAdjustments(days = 14): Promise<BudgetAdjustment[]> {
  const res = await useApi().api<any>('/budgets/adjustments/recent', { query: { days } })
  return unwrapList<BudgetAdjustment>(res)
}

export async function budgetHistory(id: string): Promise<BudgetAdjustment[]> {
  const res = await useApi().api<any>(`/budgets/${id}/adjustments`)
  return unwrapList<BudgetAdjustment>(res)
}

export function getBudgetStats(params: MonthQuery) {
  return useApi().api<BudgetStats>('/budgets/stats', { query: { ...params } })
}

export function getBudgetComparison(params: MonthQuery) {
  return useApi().api<BudgetComparison>('/budgets/comparison', { query: { ...params } })
}
