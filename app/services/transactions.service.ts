import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Transaction = components['schemas']['TransactionResponseDto']
export type PaginatedTransactions = components['schemas']['PaginatedTransactionsResponseDto']
export type CreateTransaction = components['schemas']['CreateTransactionDto']
export type UpdateTransaction = components['schemas']['UpdateTransactionDto']

export interface TransactionFilters {
  page?: number
  limit?: number
  from?: string
  to?: string
  type?: 'income' | 'expense' | 'transfer'
  status?: 'pending' | 'reconciled'
  paymentMethod?: 'bank_transfer' | 'debit_card' | 'credit_card' | 'cash'
  categoryId?: string
  accountId?: string
  search?: string
  order?: 'asc' | 'desc'
}

/** GET /transactions — paginado con filtros. */
export function listTransactions(filters: TransactionFilters = {}) {
  return useApi().api<PaginatedTransactions>('/transactions', { query: { ...filters } })
}

/** POST /transactions — income/expense exigen categoría; transfer exige destino. */
export function createTransaction(payload: CreateTransaction) {
  return useApi().api<Transaction>('/transactions', { method: 'POST', body: payload })
}

/** GET /transactions/:id */
export function getTransaction(id: string) {
  return useApi().api<Transaction>(`/transactions/${id}`)
}

/** PATCH /transactions/:id */
export function updateTransaction(id: string, payload: UpdateTransaction) {
  return useApi().api<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: payload })
}

/** DELETE /transactions/:id — borrado físico, afecta saldos y reportes. */
export function deleteTransaction(id: string) {
  return useApi().api<void>(`/transactions/${id}`, { method: 'DELETE' })
}

/** POST /transactions/reconcile — marca hasta 200 pendientes como conciliados. */
export function reconcileTransactions(ids: string[]) {
  return useApi().api<components['schemas']['ReconcileResponseDto']>('/transactions/reconcile', {
    method: 'POST',
    body: { ids },
  })
}
