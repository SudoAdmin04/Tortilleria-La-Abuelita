import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Purchase = components['schemas']['PurchaseResponseDto']
export type PurchaseItem = components['schemas']['PurchaseItemResponseDto']
export type CreatePurchase = components['schemas']['CreatePurchaseDto']
export type CreatePurchaseItem = components['schemas']['CreatePurchaseItemDto']
export type PurchaseStatus = Purchase['status']

export interface PurchaseFilters {
  page?: number
  limit?: number
  supplierId?: string
  status?: PurchaseStatus
  from?: string
  to?: string
}

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const body = res as { items?: T[]; data?: T[] } | null | undefined
  return body?.items ?? body?.data ?? []
}

export async function listPurchases(filters: PurchaseFilters = {}) {
  const res = await useApi().api<any>('/purchases', { query: { ...filters } })
  return {
    items: unwrap<Purchase>(res),
    total: Number(res?.total ?? 0),
    page: Number(res?.page ?? 1),
    limit: Number(res?.limit ?? 25),
    pages: Number(res?.pages ?? 1),
  }
}

export function createPurchase(payload: CreatePurchase) {
  return useApi().api<Purchase>('/purchases', { method: 'POST', body: payload })
}

export function getPurchase(id: string) {
  return useApi().api<Purchase>(`/purchases/${id}`)
}

export function cancelPurchase(id: string) {
  return useApi().api<Purchase>(`/purchases/${id}/cancel`, { method: 'PATCH' })
}
