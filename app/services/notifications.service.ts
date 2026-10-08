import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Notification = components['schemas']['NotificationResponseDto']
export type CreateNotification = components['schemas']['CreateNotificationDto']
export type UpdateNotification = components['schemas']['UpdateNotificationDto']

export interface PaginadoParams { pagina?: number; registros?: number; buscar?: string }

function norm<T>(res: any): { data: T[]; total: number } {
  return { data: res?.data ?? res?.items ?? (Array.isArray(res) ? res : []), total: res?.total ?? 0 }
}

export async function listNotifications(): Promise<Notification[]> {
  const res = await useApi().api<any>('/notifications')
  if (Array.isArray(res)) return res
  return res?.data ?? res?.items ?? []
}

export async function listNotificationsPaginado(params: PaginadoParams = {}) {
  const res = await useApi().api<any>('/notifications/paginado', { query: { ...params } })
  return norm<Notification>(res)
}

export function getNotification(id: number | string) {
  return useApi().api<Notification>(`/notifications/${id}`)
}

export function createNotification(payload: CreateNotification) {
  return useApi().api<Notification>('/notifications', { method: 'POST', body: payload })
}

export function updateNotification(id: number | string, payload: UpdateNotification) {
  return useApi().api<Notification>(`/notifications/${id}`, { method: 'PATCH', body: payload })
}

export function deleteNotification(id: number | string) {
  return useApi().api<void>(`/notifications/${id}`, { method: 'DELETE' })
}
