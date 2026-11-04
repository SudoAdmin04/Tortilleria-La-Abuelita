import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Production = components['schemas']['ProductionResponseDto']
export type ProductionInput = components['schemas']['ProductionInputDto']
export type CreateProduction = components['schemas']['CreateProductionDto']
export type ProductionStatus = Production['status']

export interface ProductionFilters {
  page?: number
  limit?: number
  productId?: string
  status?: ProductionStatus
  from?: string
  to?: string
}

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const body = res as { items?: T[]; data?: T[] } | null | undefined
  return body?.items ?? body?.data ?? []
}

export async function listProduction(filters: ProductionFilters = {}) {
  const res = await useApi().api<any>('/production', { query: { ...filters } })
  return {
    items: unwrap<Production>(res),
    total: Number(res?.total ?? 0),
    page: Number(res?.page ?? 1),
    limit: Number(res?.limit ?? 25),
    pages: Number(res?.pages ?? 1),
  }
}

export function createProduction(payload: CreateProduction) {
  return useApi().api<Production>('/production', { method: 'POST', body: payload })
}

export function getProduction(id: string) {
  return useApi().api<Production>(`/production/${id}`)
}

export function cancelProduction(id: string) {
  return useApi().api<Production>(`/production/${id}/cancel`, { method: 'PATCH' })
}
