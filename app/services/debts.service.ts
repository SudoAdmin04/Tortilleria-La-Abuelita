import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Debt = components['schemas']['DebtResponseDto']
export type CreateDebt = components['schemas']['CreateDebtDto']
export type UpdateDebt = components['schemas']['UpdateDebtDto']

/** GET /debts?status=open|paid — con `paidAmount` y `outstanding`. */
export function listDebts(status?: 'open' | 'paid') {
  return useApi().api<Debt[]>('/debts', { query: status ? { status } : {} })
}

/** POST /debts — payable (yo debo) o receivable (me deben). */
export function createDebt(payload: CreateDebt) {
  return useApi().api<Debt>('/debts', { method: 'POST', body: payload })
}

/** GET /debts/:id */
export function getDebt(id: string) {
  return useApi().api<Debt>(`/debts/${id}`)
}

/** PATCH /debts/:id */
export function updateDebt(id: string, payload: UpdateDebt) {
  return useApi().api<Debt>(`/debts/${id}`, { method: 'PATCH', body: payload })
}

/** DELETE /debts/:id — no borra los movimientos que la referencian. */
export function deleteDebt(id: string) {
  return useApi().api<void>(`/debts/${id}`, { method: 'DELETE' })
}

/** POST /debts/:id/settle — atajo para marcar como pagada. */
export function settleDebt(id: string) {
  return useApi().api<Debt>(`/debts/${id}/settle`, { method: 'POST' })
}
