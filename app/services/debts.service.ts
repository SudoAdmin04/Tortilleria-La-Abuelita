import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Debt = components['schemas']['DebtResponseDto']
export type CreateDebt = components['schemas']['CreateDebtDto']
export type UpdateDebt = components['schemas']['UpdateDebtDto']

export function listDebts(status?: 'open' | 'paid') {
  return useApi().api<Debt[]>('/debts', { query: status ? { status } : {} })
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

export function settleDebt(id: string) {
  return useApi().api<Debt>(`/debts/${id}/settle`, { method: 'POST' })
}
