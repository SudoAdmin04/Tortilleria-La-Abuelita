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

/**
 * El backend envuelve las listas en `{ message?, items? }`.
 * Se desenvuelve a arreglo para no romper a los consumidores.
 * Acepta también arreglo plano por tolerancia.
 */
function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const items = (res as { items?: T[]; data?: T[] } | null | undefined)?.items
    ?? (res as { data?: T[] } | null | undefined)?.data
  return items ?? []
}

/** GET /savings-goals — todas mis metas con cuenta y categoría, ordenadas por nombre. */
export async function listSavingsGoals(): Promise<SavingsGoal[]> {
  const res = await useApi().api<unknown>('/savings-goals')
  return unwrap<SavingsGoal>(res)
}

/** POST /savings-goals — `accountId`/`categoryId` opcionales, deben ser propios. */
export function createSavingsGoal(payload: CreateSavingsGoal) {
  return useApi().api<SavingsGoal>('/savings-goals', { method: 'POST', body: payload })
}

/**
 * GET /savings-goals/progress?year=&month= — avance del mes por meta.
 * Cada item: `{ goal, period, contributed, monthlyTarget, percent, remaining,
 * totalContributed, targetProgressPercent }`.
 */
export async function savingsProgress(params: { year: number, month: number }): Promise<GoalProgress[]> {
  const res = await useApi().api<unknown>('/savings-goals/progress', { query: { ...params } })
  return unwrap<GoalProgress>(res)
}

/** GET /savings-goals/:id — meta con su cuenta y categoría. */
export function getSavingsGoal(id: string) {
  return useApi().api<SavingsGoal>(`/savings-goals/${id}`)
}

/** PATCH /savings-goals/:id — parcial (nombre, montos, cuenta, categoría, activación). */
export function updateSavingsGoal(id: string, payload: UpdateSavingsGoal) {
  return useApi().api<SavingsGoal>(`/savings-goals/${id}`, { method: 'PATCH', body: payload })
}

/** DELETE /savings-goals/:id — borrado físico de la meta y su ledger (CASCADE). */
export function deleteSavingsGoal(id: string) {
  return useApi().api<void>(`/savings-goals/${id}`, { method: 'DELETE' })
}

/**
 * GET /savings-goals/:id/balance — saldo neto del ledger (`depósitos − retiros`)
 * más totales históricos y número de movimientos.
 */
export function getSavingsGoalBalance(id: string) {
  return useApi().api<SavingsGoalBalance>(`/savings-goals/${id}/balance`)
}

/**
 * GET /savings-goals/:id/entries — ledger auditable (más recientes primero).
 * Filtros opcionales `from`/`to` (YYYY-MM-DD).
 */
export async function listSavingsGoalEntries(id: string, params?: { from?: string, to?: string }): Promise<SavingsGoalEntry[]> {
  const res = await useApi().api<unknown>(`/savings-goals/${id}/entries`, { query: { ...params } })
  return unwrap<SavingsGoalEntry>(res)
}

/**
 * POST /savings-goals/:id/deposits — registra un aporte en el ledger y mueve
 * dinero real con un `transfer` operativa → reserva (si la meta tiene `accountId`).
 * Ejemplo: `{ amount: 1500, date: '2025-10-05', fromAccountId: '<operativa>' }`.
 */
export function depositToGoal(id: string, payload: DepositGoalPayload) {
  return useApi().api<SavingsGoalEntry>(`/savings-goals/${id}/deposits`, { method: 'POST', body: payload })
}

/**
 * POST /savings-goals/:id/withdrawals — registra un retiro (reserva → operativa).
 * Falla con 400 si `amount` supera el saldo del ledger. `toAccountId` opcional
 * (por defecto la operativa del último aporte).
 */
export function withdrawFromGoal(id: string, payload: WithdrawGoalPayload) {
  return useApi().api<SavingsGoalEntry>(`/savings-goals/${id}/withdrawals`, { method: 'POST', body: payload })
}

/**
 * DELETE /savings-goals/:id/entries/:entryId — revierte un aporte/retiro:
 * borra el movimiento del ledger y su transferencia asociada.
 */
export function removeSavingsGoalEntry(goalId: string, entryId: string) {
  return useApi().api<void>(`/savings-goals/${goalId}/entries/${entryId}`, { method: 'DELETE' })
}
