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

/** GET /budgets?year=&month= — límites del mes. */
export function listBudgets(params: MonthQuery) {
  return useApi().api<Budget[]>('/budgets', { query: { ...params } })
}

/** POST /budgets — combinación categoría+año+mes única. */
export function createBudget(payload: CreateBudget) {
  return useApi().api<Budget>('/budgets', { method: 'POST', body: payload })
}

/** GET /budgets/:id */
export function getBudget(id: string) {
  return useApi().api<Budget>(`/budgets/${id}`)
}

/** PATCH /budgets/:id — ajusta el límite y registra el historial. */
export function updateBudget(id: string, payload: UpdateBudget) {
  return useApi().api<Budget>(`/budgets/${id}`, { method: 'PATCH', body: payload })
}

/** DELETE /budgets/:id — borrado físico del límite. */
export function deleteBudget(id: string) {
  return useApi().api<void>(`/budgets/${id}`, { method: 'DELETE' })
}

/** POST /budgets/copy — copia límites entre meses. */
export function copyBudgets(payload: CopyBudgets) {
  return useApi().api<CopyBudgetsResult>('/budgets/copy', { method: 'POST', body: payload })
}

/** GET /budgets/adjustments/recent?days= — historial de cambios. */
export function recentAdjustments(days = 14) {
  return useApi().api<BudgetAdjustment[]>('/budgets/adjustments/recent', { query: { days } })
}

/** GET /budgets/:id/adjustments — historial de un presupuesto. */
export function budgetHistory(id: string) {
  return useApi().api<BudgetAdjustment[]>(`/budgets/${id}/adjustments`)
}
