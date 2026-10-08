import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type User = components['schemas']['UserCatalogResponseDto']
export type CreateUser = components['schemas']['CreateUserDto']
export type UpdateUser = components['schemas']['UpdateUserDto']
export interface AsignarRolPayload { roleId: number | null }
export interface PaginadoParams { pagina?: number; registros?: number; buscar?: string }

function norm<T>(res: any): { data: T[]; total: number } {
  return { data: res?.data ?? res?.items ?? (Array.isArray(res) ? res : []), total: res?.total ?? 0 }
}

export async function listUsers(): Promise<User[]> {
  const res = await useApi().api<any>('/users')
  if (Array.isArray(res)) return res
  return res?.items ?? res?.data ?? []
}

export async function listUsersPaginado(params: PaginadoParams = {}) {
  const res = await useApi().api<any>('/users/paginado', { query: { ...params } })
  return norm<User>(res)
}

export function getUser(id: string) {
  return useApi().api<User>(`/users/${id}`)
}

export function createUser(payload: CreateUser) {
  return useApi().api<User>('/users', { method: 'POST', body: payload })
}

export function updateUser(id: string, payload: UpdateUser) {
  return useApi().api<User>(`/users/${id}`, { method: 'PATCH', body: payload })
}

export function toggleUserActive(id: string) {
  return useApi().api<User>(`/users/${id}/toggle-active`, { method: 'PATCH' })
}

export function asignarRol(id: string, roleId: number | null) {
  return useApi().api<User>(`/users/${id}/rol`, {
    method: 'PATCH',
    body: { roleId } as unknown as components['schemas']['AsignarRolDto'],
  })
}
