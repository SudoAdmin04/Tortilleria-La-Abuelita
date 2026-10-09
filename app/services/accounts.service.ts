import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Account = components['schemas']['AccountResponseDto']
export type CreateAccount = components['schemas']['CreateAccountDto']
export type UpdateAccount = components['schemas']['UpdateAccountDto']
export type AccountType = Account['type']

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const items = (res as { items?: T[]; data?: T[] } | null | undefined)?.items
    ?? (res as { data?: T[] } | null | undefined)?.data
  return items ?? []
}

export async function listAccounts(): Promise<Account[]> {
  const res = await useApi().api<unknown>('/accounts')
  return unwrap<Account>(res)
}

export function createAccount(payload: CreateAccount) {
  return useApi().api<Account>('/accounts', { method: 'POST', body: payload })
}

export function getAccount(id: string) {
  return useApi().api<Account>(`/accounts/${id}`)
}

export function updateAccount(id: string, payload: UpdateAccount) {
  return useApi().api<Account>(`/accounts/${id}`, { method: 'PATCH', body: payload })
}

export function deleteAccount(id: string) {
  return useApi().api<void>(`/accounts/${id}`, { method: 'DELETE' })
}
