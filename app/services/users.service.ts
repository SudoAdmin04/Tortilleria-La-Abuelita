import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type User = components['schemas']['UserResponseDto']
export type AsignarRol = components['schemas']['AsignarRolDto']

/** GET /users — listar usuarios (admin). Respuesta { message } + lista; normalizamos a array. */
export async function listUsers(): Promise<User[]> {
  const res = await useApi().api<any>('/users')
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.items)) return res.items
  return []
}

/** PATCH /users/:id/rol — asignar rol (aplica en próximo login/refresh). */
export function asignarRol(id: string, roleId: number | null) {
  return useApi().api<User & { message?: string }>(`/users/${id}/rol`, {
    method: 'PATCH',
    body: { roleId } as unknown as AsignarRol,
  })
}
