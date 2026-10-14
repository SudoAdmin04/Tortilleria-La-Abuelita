import {
  getCalendarRange,
  getCalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CalendarEvent,
  type CalendarRange,
  type CreateCalendarEvent,
  type UpdateCalendarEvent,
} from '~/services/budget-calendar.service'
import { getApiMessage } from '~/utils/api-error'

export type { CalendarEvent, CalendarRange, CreateCalendarEvent, UpdateCalendarEvent }
export type VistaCalendario = 'dia' | 'semana' | 'mes'

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISO(v: string): Date {
  const [y, m, d] = v.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

function startOfWeek(d: Date): Date {
  const c = new Date(d)
  const dow = (c.getDay() + 6) % 7
  c.setDate(c.getDate() - dow)
  c.setHours(0, 0, 0, 0)
  return c
}

function monthGridRange(anchor: Date): { from: string, to: string } {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = startOfWeek(first)
  const end = addDays(start, 41)
  return { from: toISO(start), to: toISO(end) }
}

export const useCalendarioPresupuestos = () => {
  const toast = useToast()
  const vista = ref<VistaCalendario>('mes')
  const anchor = ref<Date>(new Date())
  const range = ref<CalendarRange | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selected = ref<CalendarEvent | null>(null)
  const selectedDay = ref<string>(toISO(new Date()))
  const filter = reactive({
    categoryId: undefined as string | undefined,
    kind: undefined as string | undefined,
  })

  const rango = computed<{ from: string, to: string }>(() => {
    if (vista.value === 'dia') {
      const iso = toISO(anchor.value)
      return { from: iso, to: iso }
    }
    if (vista.value === 'semana') {
      const s = startOfWeek(anchor.value)
      return { from: toISO(s), to: toISO(addDays(s, 6)) }
    }
    return monthGridRange(anchor.value)
  })

  const events = computed<CalendarEvent[]>(() => range.value?.events ?? [])
  const days = computed<Record<string, string[]>>(() => range.value?.days ?? {})
  const byId = computed(() => new Map(events.value.map(e => [e.id, e])))

  function eventsOfDay(iso: string): CalendarEvent[] {
    const ids = days.value[iso] ?? []
    return ids.map(id => byId.value.get(id)).filter((e): e is CalendarEvent => !!e)
  }

  const dayEvents = computed(() => eventsOfDay(selectedDay.value))

  /**
   * Ventana ya cargada del servidor. Solo se pide de nuevo cuando el rango
   * visible sale de ella, cambian los filtros o se fuerza tras un CRUD.
   * Los clics en días solo mueven `selectedDay` (local, sin petición).
   */
  const lastQuery = ref<{ from: string, to: string, categoryId?: string, kind?: string } | null>(null)

  function isCovered(from: string, to: string): boolean {
    const q = lastQuery.value
    if (!q) return false
    if (q.categoryId !== filter.categoryId || q.kind !== filter.kind) return false
    return q.from <= from && q.to >= to
  }

  /** Eventos que solapan el rango visible (día/semana/mes actual). */
  const visibleEvents = computed(() => {
    const { from, to } = rango.value
    return events.value.filter(e => (e.startDate ?? '') <= to && (e.endDate ?? '') >= from)
  })
  const totalAmount = computed(() => visibleEvents.value.reduce((s, e) => s + (Number(e.amount) || 0), 0))
  const count = computed(() => visibleEvents.value.length)

  const titulo = computed(() => {
    const f = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' })
    if (vista.value === 'dia') {
      return new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(anchor.value)
    }
    return f.format(anchor.value).replace(/^\w/, c => c.toUpperCase())
  })

  async function fetchRange(force = false) {
    const { from, to } = rango.value
    // Si la ventana cargada ya cubre el rango visible, no hay petición.
    if (!force && isCovered(from, to)) return
    loading.value = true
    error.value = null
    try {
      range.value = await getCalendarRange({
        from,
        to,
        categoryId: filter.categoryId,
        kind: filter.kind,
      })
      lastQuery.value = { from, to, categoryId: filter.categoryId, kind: filter.kind }
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener el calendario')
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    try {
      selected.value = await getCalendarEvent(id)
      return selected.value
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo obtener el evento'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return null
    }
  }

  async function create(payload: CreateCalendarEvent) {
    try {
      const r = await createCalendarEvent(payload)
      toast.add({ title: 'Evento agendado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchRange(true)
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al agendar evento'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: string, payload: UpdateCalendarEvent) {
    try {
      const r = await updateCalendarEvent(id, payload)
      toast.add({ title: 'Evento actualizado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchRange(true)
      if (selected.value?.id === id) selected.value = r
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al actualizar evento'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function move(id: string, startDate: string, endDate: string) {
    return update(id, { startDate, endDate })
  }

  async function remove(id: string) {
    try {
      await deleteCalendarEvent(id)
      toast.add({ title: 'Evento eliminado', color: 'success', icon: 'i-lucide-circle-check' })
      if (selected.value?.id === id) selected.value = null
      await fetchRange(true)
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo eliminar'), color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  function goToday() {
    anchor.value = new Date()
    selectedDay.value = toISO(anchor.value)
  }

  /** Salto directo a una fecha (día clampado al largo del mes). */
  function goTo(year: number, month: number, day?: number) {
    const maxDay = new Date(year, month, 0).getDate()
    const d = Math.min(Math.max(day ?? anchor.value.getDate(), 1), maxDay)
    anchor.value = new Date(year, month - 1, d)
    selectedDay.value = toISO(anchor.value)
  }

  function goPrev() {
    if (vista.value === 'dia') anchor.value = addDays(anchor.value, -1)
    else if (vista.value === 'semana') anchor.value = addDays(anchor.value, -7)
    else anchor.value = new Date(anchor.value.getFullYear(), anchor.value.getMonth() - 1, 1)
  }

  function goNext() {
    if (vista.value === 'dia') anchor.value = addDays(anchor.value, 1)
    else if (vista.value === 'semana') anchor.value = addDays(anchor.value, 7)
    else anchor.value = new Date(anchor.value.getFullYear(), anchor.value.getMonth() + 1, 1)
  }

  function selectDay(iso: string) {
    // Solo selección local: no mueve `anchor` para no disparar peticiones
    // ni saltos de mes al pulsar días grises de meses vecinos.
    selectedDay.value = iso
  }

  // Se observa el rango visible (no el `anchor` crudo): los clics en días
  // no cambian el rango y por tanto no refetchean.
  watch(
    () => `${rango.value.from}|${rango.value.to}|${filter.categoryId ?? ''}|${filter.kind ?? ''}`,
    () => fetchRange(),
  )

  return {
    vista, anchor, range, loading, error, selected, selectedDay, filter,
    rango, events, days, byId, dayEvents, totalAmount, count, titulo,
    fetchRange, fetchById, create, update, move, remove,
    goToday, goTo, goPrev, goNext, selectDay, eventsOfDay, toISO, parseISO,
  }
}
