import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Role = components['schemas']['RoleResponseDto']
export type CreateRole = components['schemas']['CreateRoleDto']
export type UpdateRole = components['schemas']['UpdateRoleDto']

export interface PaginadoParams { pagina?: number; registros?: number; buscar?: string }

function norm<T>(res: any): { data: T[]; total: number } {
  return { data: res?.data ?? res?.items ?? (Array.isArray(res) ? res : []), total: res?.total ?? 0 }
}

export async function listRoles(): Promise<Role[]> {
  const res = await useApi().api<any>('/roles')
  if (Array.isArray(res)) return res
  return res?.data ?? res?.items ?? []
}

export async function listRolesPaginado(params: PaginadoParams = {}) {
  const res = await useApi().api<any>('/roles/paginado', { query: { ...params } })
  return norm<Role>(res)
}

export function getRole(id: number | string) {
  return useApi().api<Role>(`/roles/${id}`)
}

export function createRole(payload: CreateRole) {
  return useApi().api<Role>('/roles', { method: 'POST', body: payload })
}

export function updateRole(id: number | string, payload: UpdateRole) {
  return useApi().api<Role>(`/roles/${id}`, { method: 'PATCH', body: payload })
}

export function deleteRole(id: number | string) {
  return useApi().api<void>(`/roles/${id}`, { method: 'DELETE' })
}

export function toggleRoleActive(id: number | string) {
  return useApi().api<Role>(`/roles/${id}/toggle-active`, { method: 'PATCH' })
}
