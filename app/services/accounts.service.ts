import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Account = components['schemas']['AccountResponseDto']
export type CreateAccount = components['schemas']['CreateAccountDto']
export type UpdateAccount = components['schemas']['UpdateAccountDto']

/** GET /accounts — con `balance` calculado, ordenadas por principal y nombre. */
export function listAccounts() {
  return useApi().api<Account[]>('/accounts')
}

/** POST /accounts — nombre único por usuario. */
export function createAccount(payload: CreateAccount) {
  return useApi().api<Account>('/accounts', { method: 'POST', body: payload })
}

/** GET /accounts/:id */
export function getAccount(id: string) {
  return useApi().api<Account>(`/accounts/${id}`)
}

/** PATCH /accounts/:id */
export function updateAccount(id: string, payload: UpdateAccount) {
  return useApi().api<Account>(`/accounts/${id}`, { method: 'PATCH', body: payload })
}

/** DELETE /accounts/:id — 409 si tiene movimientos (desactivar en su lugar). */
export function deleteAccount(id: string) {
  return useApi().api<void>(`/accounts/${id}`, { method: 'DELETE' })
}
