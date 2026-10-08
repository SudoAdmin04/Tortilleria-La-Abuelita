import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type RoleScreen = components['schemas']['RoleScreenResponseDto']
export type CreateRoleScreen = components['schemas']['CreateRoleScreenDto']
export type UpdateRoleScreen = components['schemas']['UpdateRoleScreenDto']

export interface PaginadoParams { pagina?: number; registros?: number; buscar?: string }

function norm<T>(res: any): { data: T[]; total: number } {
  return { data: res?.data ?? res?.items ?? (Array.isArray(res) ? res : []), total: res?.total ?? 0 }
}

export async function listRoleScreens(): Promise<RoleScreen[]> {
  const res = await useApi().api<any>('/role-screens')
  if (Array.isArray(res)) return res
  return res?.data ?? res?.items ?? []
}

export async function listRoleScreensPaginado(params: PaginadoParams = {}) {
  const res = await useApi().api<any>('/role-screens/paginado', { query: { ...params } })
  return norm<RoleScreen>(res)
}

export function getRoleScreen(id: number | string) {
  return useApi().api<RoleScreen>(`/role-screens/${id}`)
}

export function createRoleScreen(payload: CreateRoleScreen) {
  return useApi().api<RoleScreen>('/role-screens', { method: 'POST', body: payload })
}

export function updateRoleScreen(id: number | string, payload: UpdateRoleScreen) {
  return useApi().api<RoleScreen>(`/role-screens/${id}`, { method: 'PATCH', body: payload })
}

export function deleteRoleScreen(id: number | string) {
  return useApi().api<void>(`/role-screens/${id}`, { method: 'DELETE' })
}
