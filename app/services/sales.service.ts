import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Sale = components['schemas']['SaleResponseDto']
export type SaleItem = components['schemas']['SaleItemResponseDto']
export type CreateSale = components['schemas']['CreateSaleDto']
export type CreateSaleItem = components['schemas']['CreateSaleItemDto']
export type SaleStatus = Sale['status']

export interface SaleFilters {
  page?: number
  limit?: number
  status?: SaleStatus
  from?: string
  to?: string
}

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const body = res as { items?: T[]; data?: T[] } | null | undefined
  return body?.items ?? body?.data ?? []
}

export async function listSales(filters: SaleFilters = {}) {
  const res = await useApi().api<any>('/sales', { query: { ...filters } })
  return {
    items: unwrap<Sale>(res),
    total: Number(res?.total ?? 0),
    page: Number(res?.page ?? 1),
    limit: Number(res?.limit ?? 25),
    pages: Number(res?.pages ?? 1),
  }
}

export function createSale(payload: CreateSale) {
  return useApi().api<Sale>('/sales', { method: 'POST', body: payload })
}

export function getSale(id: string) {
  return useApi().api<Sale>(`/sales/${id}`)
}

export function cancelSale(id: string) {
  return useApi().api<Sale>(`/sales/${id}/cancel`, { method: 'PATCH' })
}
