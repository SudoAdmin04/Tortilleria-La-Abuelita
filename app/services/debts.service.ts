import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Debt = components['schemas']['DebtResponseDto']
export type CreateDebt = components['schemas']['CreateDebtDto']
export type UpdateDebt = components['schemas']['UpdateDebtDto']
export type DebtStatus = Debt['status']
export type DebtDirection = Debt['direction']
export type DebtStats = components['schemas']['DebtStatsResponseDto']

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const items = (res as { items?: T[]; data?: T[] } | null | undefined)?.items
    ?? (res as { data?: T[] } | null | undefined)?.data
  return items ?? []
}

export async function listDebts(status?: DebtStatus): Promise<Debt[]> {
  const res = await useApi().api<unknown>('/debts', { query: status ? { status } : {} })
  return unwrap<Debt>(res)
}

export function createDebt(payload: CreateDebt) {
  return useApi().api<Debt>('/debts', { method: 'POST', body: payload })
}

export function getDebt(id: string) {
  return useApi().api<Debt>(`/debts/${id}`)
}

export function updateDebt(id: string, payload: UpdateDebt) {
  return useApi().api<Debt>(`/debts/${id}`, { method: 'PATCH', body: payload })
}

export function deleteDebt(id: string) {
  return useApi().api<void>(`/debts/${id}`, { method: 'DELETE' })
}

export function getDebtsStats() {
  return useApi().api<DebtStats>('/debts/stats')
}

export function settleDebt(id: string) {
  return useApi().api<Debt>(`/debts/${id}/settle`, { method: 'POST' })
}
