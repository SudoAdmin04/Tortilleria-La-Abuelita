import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Screen = components['schemas']['ScreenResponseDto']
export type CreateScreen = components['schemas']['CreateScreenDto']
export type UpdateScreen = components['schemas']['UpdateScreenDto']

export interface PaginadoParams { pagina?: number; registros?: number; buscar?: string }
export interface Paginado<T> { data: T[]; total: number; message?: string }

function norm<T>(res: any): Paginado<T> {
  return { data: res?.data ?? res?.items ?? (Array.isArray(res) ? res : []), total: res?.total ?? 0, message: res?.message }
}

export async function listScreens(): Promise<Screen[]> {
  const res = await useApi().api<any>('/screens')
  if (Array.isArray(res)) return res
  return res?.data ?? res?.items ?? []
}

export async function listScreensPaginado(params: PaginadoParams = {}): Promise<Paginado<Screen>> {
  const res = await useApi().api<any>('/screens/paginado', { query: { ...params } })
  return norm<Screen>(res)
}

export function getScreen(id: number | string) {
  return useApi().api<Screen>(`/screens/${id}`)
}

export function createScreen(payload: CreateScreen) {
  return useApi().api<Screen>('/screens', { method: 'POST', body: payload })
}

export function updateScreen(id: number | string, payload: UpdateScreen) {
  return useApi().api<Screen>(`/screens/${id}`, { method: 'PATCH', body: payload })
}

export function deleteScreen(id: number | string) {
  return useApi().api<void>(`/screens/${id}`, { method: 'DELETE' })
}

export function toggleScreen(id: number | string) {
  return useApi().api<Screen>(`/screens/${id}/toggle-active`, { method: 'PATCH' })
}
