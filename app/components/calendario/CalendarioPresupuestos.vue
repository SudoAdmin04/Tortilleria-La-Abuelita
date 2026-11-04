<script setup lang="ts">
import type { CalendarEvent } from '~/services/budget-calendar.service'
import type { VistaCalendario } from '~/composables/useCalendarioPresupuestos'
import { formatMoney } from '~/utils/format'

const props = withDefaults(defineProps<{
  vista: VistaCalendario
  anchor: Date
  days: Record<string, string[]>
  events: CalendarEvent[]
  selectedDay: string
  loading?: boolean
  currency?: string
}>(), { loading: false, currency: 'MXN' })

const emit = defineEmits<{
  'update:vista': [v: VistaCalendario]
  prev: []
  next: []
  today: []
  selectDay: [iso: string]
  selectEvent: [e: CalendarEvent]
  createOnDay: [iso: string]
}>()

const vistaOpts: { value: VistaCalendario, label: string }[] = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
]

const byId = computed(() => new Map(props.events.map(e => [e.id, e])))
function eventsOfDay(iso: string): CalendarEvent[] {
  return (props.days[iso] ?? []).map(id => byId.value.get(id)).filter((e): e is CalendarEvent => !!e)
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
}
function parseISO(v: string): Date {
  const [y, m, d] = v.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}
function addDays(d: Date, n: number) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}
function startOfWeek(d: Date) {
  const c = new Date(d)
  const dow = (c.getDay() + 6) % 7
  c.setDate(c.getDate() - dow)
  return c
}
function isToday(iso: string) {
  return iso === toISO(new Date())
}
function dayNum(iso: string) {
  return Number(iso.split('-')[2])
}
function weekdayShort(iso: string) {
  return new Intl.DateTimeFormat('es-MX', { weekday: 'short' }).format(parseISO(iso)).replace('.', '')
}

const weekDays = computed(() => {
  const s = startOfWeek(props.anchor)
  return Array.from({ length: 7 }, (_, i) => toISO(addDays(s, i)))
})
const monthCells = computed(() => {
  const first = new Date(props.anchor.getFullYear(), props.anchor.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => toISO(addDays(start, i)))
})
const isOtherMonth = (iso: string) => parseISO(iso).getMonth() !== props.anchor.getMonth()

function barStyle(e: CalendarEvent) {
  return e.color ? { backgroundColor: `${e.color}26`, borderLeftColor: e.color, color: e.color } : {}
}
</script>

<template>
  <UCard class="border border-default overflow-hidden" :ui="{ header: 'py-3 px-4 border-b border-default bg-elevated/60', body: 'p-0' }">
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex-1" />
        <div class="flex rounded-lg border border-default overflow-hidden">
          <UButton
            v-for="o in vistaOpts" :key="o.value"
            :label="o.label"
            size="sm"
            :color="props.vista === o.value ? 'primary' : 'neutral'"
            :variant="props.vista === o.value ? 'solid' : 'ghost'"
            class="rounded-none"
            @click="emit('update:vista', o.value)"
          />
        </div>
      </div>
    </template>

    <template #default>
      <div v-if="props.loading" class="p-4 flex flex-col gap-2">
        <USkeleton v-for="i in 4" :key="i" class="h-12 w-full" />
      </div>

      <div v-else-if="props.vista === 'dia'" class="p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-highlighted">{{ selectedDay }}</p>
          <UButton size="xs" icon="i-lucide-plus" label="Agendar" @click="emit('createOnDay', props.selectedDay)" />
        </div>
        <button
          v-for="e in eventsOfDay(props.selectedDay)" :key="e.id"
          class="flex items-center gap-3 rounded-xl border border-default border-l-4 bg-elevated/60 px-3 py-2.5 text-left hover:bg-elevated"
          :style="barStyle(e)"
          @click="emit('selectEvent', e)"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-highlighted truncate">{{ e.title }}</p>
            <p class="text-xs text-muted">{{ e.category.name }} · {{ e.startDate }} → {{ e.endDate }}</p>
          </div>
          <span class="text-sm font-bold text-highlighted whitespace-nowrap">{{ formatMoney(e.amount, props.currency) }}</span>
        </button>
        <p v-if="!eventsOfDay(props.selectedDay).length" class="text-sm text-muted text-center py-8">Sin eventos este día.</p>
      </div>

      <div v-else-if="props.vista === 'semana'" class="grid grid-cols-7 divide-x divide-default">
        <div v-for="iso in weekDays" :key="iso" class="min-h-64 flex flex-col">
          <button class="p-2 text-center border-b border-default hover:bg-elevated/60" :class="iso === props.selectedDay ? 'bg-primary/10' : ''" @click="emit('selectDay', iso)">
            <p class="text-[11px] uppercase text-muted">{{ weekdayShort(iso) }}</p>
            <p class="mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-bold" :class="isToday(iso) ? 'bg-primary text-white' : 'text-highlighted'">{{ dayNum(iso) }}</p>
          </button>
          <div class="flex flex-1 flex-col gap-1 p-1.5">
            <button
              v-for="e in eventsOfDay(iso).slice(0, 5)" :key="e.id"
              class="truncate rounded-md border-l-[3px] px-1.5 py-1 text-left text-[11px] font-semibold hover:opacity-80"
              :style="barStyle(e)"
              :title="`${e.title} · ${formatMoney(e.amount, props.currency)}`"
              @click="emit('selectEvent', e)"
            >
              {{ e.title }}
            </button>
            <button v-if="eventsOfDay(iso).length > 5" class="text-[11px] text-muted hover:text-highlighted" @click="emit('selectDay', iso)">
              +{{ eventsOfDay(iso).length - 5 }} más
            </button>
            <button class="mt-auto rounded-md border border-dashed border-default py-1 text-[11px] text-dimmed hover:text-highlighted hover:border-accented" @click="emit('createOnDay', iso)">+</button>
          </div>
        </div>
      </div>

      <!-- VISTA MES -->
      <div v-else>
        <div class="grid grid-cols-7 border-b border-default">
          <div v-for="d in ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']" :key="d" class="py-2 text-center text-[11px] font-bold uppercase tracking-wide text-muted">{{ d }}</div>
        </div>
        <div class="grid grid-cols-7 auto-rows-[minmax(92px,1fr)]">
          <div
            v-for="iso in monthCells" :key="iso"
            class="flex flex-col gap-1 border-b border-r border-muted p-1.5 hover:bg-elevated/60 [&:nth-child(7n)]:border-r-0"
            :class="[(isOtherMonth(iso) ? 'bg-black/20 opacity-60' : ''), iso === props.selectedDay ? 'ring-1 ring-inset ring-primary/60' : '']"
            @click="emit('selectDay', iso)"
          >
            <div class="flex items-center justify-between">
              <span class="flex size-6 items-center justify-center rounded-full text-xs font-bold" :class="isToday(iso) ? 'bg-primary text-white' : 'text-toned'">{{ dayNum(iso) }}</span>
              <button class="text-dimmed hover:text-highlighted text-xs leading-none" @click.stop="emit('createOnDay', iso)">+</button>
            </div>
            <button
              v-for="e in eventsOfDay(iso).slice(0, 3)" :key="e.id"
              class="truncate rounded-md border-l-[3px] px-1.5 py-0.5 text-left text-[11px] font-semibold hover:opacity-80"
              :style="barStyle(e)"
              :title="`${e.title} · ${formatMoney(e.amount, props.currency)}`"
              @click.stop="emit('selectEvent', e)"
            >
              {{ e.title }}
            </button>
            <span v-if="eventsOfDay(iso).length > 3" class="text-[11px] text-muted">+{{ eventsOfDay(iso).length - 3 }} más</span>
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>
