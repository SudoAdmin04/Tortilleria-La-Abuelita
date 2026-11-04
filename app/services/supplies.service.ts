import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Supply = components['schemas']['SupplyResponseDto']
export type CreateSupply = components['schemas']['CreateSupplyDto']
export type UpdateSupply = components['schemas']['UpdateSupplyDto']
export type SupplyUnit = Supply['unit']

export const SUPPLY_UNITS: { value: SupplyUnit; label: string }[] = [
  { value: 'kg', label: 'Kilogramo' },
  { value: 'g', label: 'Gramo' },
  { value: 'l', label: 'Litro' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'piece', label: 'Pieza' },
  { value: 'pack', label: 'Paquete' },
  { value: 'box', label: 'Caja' },
]

export function supplyUnitLabel(unit: string | null | undefined): string {
  return SUPPLY_UNITS.find(u => u.value === unit)?.label ?? unit ?? '—'
}

export interface SupplyPaginadoParams {
  pagina?: number
  registros?: number
  buscar?: string
  isActive?: boolean
  lowStock?: boolean
}

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const body = res as { items?: T[]; data?: T[] } | null | undefined
  return body?.items ?? body?.data ?? []
}

export async function listSupplies(): Promise<Supply[]> {
  const res = await useApi().api<unknown>('/supplies')
  return unwrap<Supply>(res)
}

export async function listSuppliesPaginado(params: SupplyPaginadoParams = {}) {
  const res = await useApi().api<any>('/supplies/paginado', { query: { ...params } })
  return { data: unwrap<Supply>(res), total: Number(res?.total ?? 0) }
}

export function createSupply(payload: CreateSupply) {
  return useApi().api<Supply>('/supplies', { method: 'POST', body: payload })
}

export function getSupply(id: string) {
  return useApi().api<Supply>(`/supplies/${id}`)
}

export function updateSupply(id: string, payload: UpdateSupply) {
  return useApi().api<Supply>(`/supplies/${id}`, { method: 'PATCH', body: payload })
}

export function deleteSupply(id: string) {
  return useApi().api<void>(`/supplies/${id}`, { method: 'DELETE' })
}

export function toggleSupplyActive(id: string) {
  return useApi().api<Supply>(`/supplies/${id}/toggle-active`, { method: 'PATCH' })
}
