import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type SavingsGoal = components['schemas']['SavingsGoalResponseDto']
export type CreateSavingsGoal = components['schemas']['CreateSavingsGoalDto']
export type UpdateSavingsGoal = components['schemas']['UpdateSavingsGoalDto']
export type GoalProgress = components['schemas']['GoalProgressResponseDto']

/** GET /savings-goals */
export function listSavingsGoals() {
  return useApi().api<SavingsGoal[]>('/savings-goals')
}

/** POST /savings-goals */
export function createSavingsGoal(payload: CreateSavingsGoal) {
  return useApi().api<SavingsGoal>('/savings-goals', { method: 'POST', body: payload })
}

/** GET /savings-goals/progress?year=&month= — avance del mes por meta. */
export function savingsProgress(params: { year: number, month: number }) {
  return useApi().api<GoalProgress[]>('/savings-goals/progress', { query: { ...params } })
}

/** GET /savings-goals/:id */
export function getSavingsGoal(id: string) {
  return useApi().api<SavingsGoal>(`/savings-goals/${id}`)
}

/** PATCH /savings-goals/:id */
export function updateSavingsGoal(id: string, payload: UpdateSavingsGoal) {
  return useApi().api<SavingsGoal>(`/savings-goals/${id}`, { method: 'PATCH', body: payload })
}

/** DELETE /savings-goals/:id — no borra los movimientos asociados. */
export function deleteSavingsGoal(id: string) {
  return useApi().api<void>(`/savings-goals/${id}`, { method: 'DELETE' })
}
