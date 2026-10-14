import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type CalendarEvent = components['schemas']['CalendarEventResponseDto']
export type CalendarRange = components['schemas']['CalendarRangeResponseDto']
export type CreateCalendarEvent = components['schemas']['CreateCalendarEventDto']
export type UpdateCalendarEvent = components['schemas']['UpdateCalendarEventDto']

export interface CalendarQuery {
  from?: string
  to?: string
  categoryId?: string
  kind?: string
}

export function getCalendarRange(params: CalendarQuery = {}) {
  const query: Record<string, string> = {}
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to
  if (params.categoryId) query.categoryId = params.categoryId
  if (params.kind) query.kind = params.kind
  return useApi().api<CalendarRange>('/budgets/calendar', { query })
}

export function getCalendarEvent(id: string) {
  return useApi().api<CalendarEvent>(`/budgets/calendar/${id}`)
}

export function createCalendarEvent(payload: CreateCalendarEvent) {
  return useApi().api<CalendarEvent>('/budgets/calendar', { method: 'POST', body: payload })
}

export function updateCalendarEvent(id: string, payload: UpdateCalendarEvent) {
  return useApi().api<CalendarEvent>(`/budgets/calendar/${id}`, { method: 'PATCH', body: payload })
}

export function deleteCalendarEvent(id: string) {
  return useApi().api<void>(`/budgets/calendar/${id}`, { method: 'DELETE' })
}
