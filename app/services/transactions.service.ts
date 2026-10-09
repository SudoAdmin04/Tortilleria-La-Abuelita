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

export function listTransactions(filters: TransactionFilters = {}) {
  return useApi().api<PaginatedTransactions>('/transactions', { query: { ...filters } })
}

export function createTransaction(payload: CreateTransaction) {
  return useApi().api<Transaction>('/transactions', { method: 'POST', body: payload })
}

export function getTransaction(id: string) {
  return useApi().api<Transaction>(`/transactions/${id}`)
}

export function updateTransaction(id: string, payload: UpdateTransaction) {
  return useApi().api<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: payload })
}

export function deleteTransaction(id: string) {
  return useApi().api<void>(`/transactions/${id}`, { method: 'DELETE' })
}

export function reconcileTransactions(ids: string[]) {
  return useApi().api<components['schemas']['ReconcileResponseDto']>('/transactions/reconcile', {
    method: 'POST',
    body: { ids },
  })
}
