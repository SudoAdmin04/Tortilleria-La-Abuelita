import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Supplier = components['schemas']['SupplierResponseDto']
export type CreateSupplier = components['schemas']['CreateSupplierDto']
export type UpdateSupplier = components['schemas']['UpdateSupplierDto']

export interface SupplierPaginadoParams {
  pagina?: number
  registros?: number
  buscar?: string
  isActive?: boolean
}

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const body = res as { items?: T[]; data?: T[] } | null | undefined
  return body?.items ?? body?.data ?? []
}

export async function listSuppliers(): Promise<Supplier[]> {
  const res = await useApi().api<unknown>('/suppliers')
  return unwrap<Supplier>(res)
}

export async function listSuppliersPaginado(params: SupplierPaginadoParams = {}) {
  const res = await useApi().api<any>('/suppliers/paginado', { query: { ...params } })
  return { data: unwrap<Supplier>(res), total: Number(res?.total ?? 0) }
}

export function createSupplier(payload: CreateSupplier) {
  return useApi().api<Supplier>('/suppliers', { method: 'POST', body: payload })
}

export function getSupplier(id: string) {
  return useApi().api<Supplier>(`/suppliers/${id}`)
}

export function updateSupplier(id: string, payload: UpdateSupplier) {
  return useApi().api<Supplier>(`/suppliers/${id}`, { method: 'PATCH', body: payload })
}

export function deleteSupplier(id: string) {
  return useApi().api<void>(`/suppliers/${id}`, { method: 'DELETE' })
}

export function toggleSupplierActive(id: string) {
  return useApi().api<Supplier>(`/suppliers/${id}/toggle-active`, { method: 'PATCH' })
}
