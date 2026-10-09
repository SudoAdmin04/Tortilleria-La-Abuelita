import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type SavingsGoal = components['schemas']['SavingsGoalResponseDto']
export type CreateSavingsGoal = components['schemas']['CreateSavingsGoalDto']
export type UpdateSavingsGoal = components['schemas']['UpdateSavingsGoalDto']
export type GoalProgress = components['schemas']['GoalProgressResponseDto']
export type SavingsGoalBalance = components['schemas']['SavingsGoalBalanceResponseDto']
export type SavingsGoalEntry = components['schemas']['SavingsGoalEntryResponseDto']
export type DepositGoalPayload = components['schemas']['DepositSavingsGoalDto']
export type WithdrawGoalPayload = components['schemas']['WithdrawSavingsGoalDto']

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const items = (res as { items?: T[]; data?: T[] } | null | undefined)?.items
    ?? (res as { data?: T[] } | null | undefined)?.data
  return items ?? []
}

export async function listSavingsGoals(): Promise<SavingsGoal[]> {
  const res = await useApi().api<unknown>('/savings-goals')
  return unwrap<SavingsGoal>(res)
}

export function createSavingsGoal(payload: CreateSavingsGoal) {
  return useApi().api<SavingsGoal>('/savings-goals', { method: 'POST', body: payload })
}

export async function savingsProgress(params: { year: number, month: number }): Promise<GoalProgress[]> {
  const res = await useApi().api<unknown>('/savings-goals/progress', { query: { ...params } })
  return unwrap<GoalProgress>(res)
}

export function getSavingsGoal(id: string) {
  return useApi().api<SavingsGoal>(`/savings-goals/${id}`)
}

export function updateSavingsGoal(id: string, payload: UpdateSavingsGoal) {
  return useApi().api<SavingsGoal>(`/savings-goals/${id}`, { method: 'PATCH', body: payload })
}

export function deleteSavingsGoal(id: string) {
  return useApi().api<void>(`/savings-goals/${id}`, { method: 'DELETE' })
}

export function getSavingsGoalBalance(id: string) {
  return useApi().api<SavingsGoalBalance>(`/savings-goals/${id}/balance`)
}

export async function listSavingsGoalEntries(id: string, params?: { from?: string, to?: string }): Promise<SavingsGoalEntry[]> {
  const res = await useApi().api<unknown>(`/savings-goals/${id}/entries`, { query: { ...params } })
  return unwrap<SavingsGoalEntry>(res)
}

export function depositToGoal(id: string, payload: DepositGoalPayload) {
  return useApi().api<SavingsGoalEntry>(`/savings-goals/${id}/deposits`, { method: 'POST', body: payload })
}

export function withdrawFromGoal(id: string, payload: WithdrawGoalPayload) {
  return useApi().api<SavingsGoalEntry>(`/savings-goals/${id}/withdrawals`, { method: 'POST', body: payload })
}

export function removeSavingsGoalEntry(goalId: string, entryId: string) {
  return useApi().api<void>(`/savings-goals/${goalId}/entries/${entryId}`, { method: 'DELETE' })
}
