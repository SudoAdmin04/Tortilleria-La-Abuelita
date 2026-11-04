<script setup lang="ts">
import type { CalendarEvent } from '~/services/budget-calendar.service'
import type { VistaCalendario } from '~/composables/useCalendarioPresupuestos'
import { listCategories } from '~/services/categories.service'
import { formatMoney } from '~/utils/format'
import { getApiMessage } from '~/utils/api-error'

useHead({ title: 'Calendario de presupuestos' })

const auth = useAuthStore()
const toast = useToast()
const currency = computed(() => auth.user?.currency || 'MXN')

const cal = useCalendarioPresupuestos()
const drawerOpen = ref(false)
const editing = ref<CalendarEvent | null>(null)
const diaInicial = ref<string>(cal.selectedDay.value)
const catOpts = ref<{ value: string, label: string }[]>([])

// Salto directo por día / mes / año
const fYear = ref(cal.anchor.value.getFullYear())
const fMonth = ref(cal.anchor.value.getMonth() + 1)
const fDay = ref(cal.anchor.value.getDate())

const monthItems = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
]
const yearItems = Array.from({ length: 9 }, (_, i) => {
  const y = new Date().getFullYear() - 4 + i
  return { value: y, label: `${y}` }
})
const maxDay = computed(() => new Date(fYear.value, fMonth.value, 0).getDate())

function syncFilter() {
  const a = cal.anchor.value
  fYear.value = a.getFullYear()
  fMonth.value = a.getMonth() + 1
  fDay.value = a.getDate()
}

function aplicarSalto() {
  cal.goTo(fYear.value, fMonth.value, fDay.value)
  syncFilter()
}

const stats = computed(() => [
  { label: 'Eventos en rango', value: `${cal.count.value}`, sub: cal.titulo.value, icon: 'i-lucide-calendar-days', tone: 'primary' as const },
  { label: 'Monto agendado', value: formatMoney(cal.totalAmount.value, currency.value), sub: `${cal.events.value.length} eventos`, icon: 'i-lucide-wallet', tone: 'success' as const },
  { label: 'Vista', value: cal.vista.value === 'mes' ? 'Mes' : cal.vista.value === 'semana' ? 'Semana' : 'Día', sub: `${cal.rango.value.from} → ${cal.rango.value.to}`, icon: 'i-lucide-layout-grid', tone: 'neutral' as const },
])

function openCreate(iso?: string) {
  editing.value = null
  diaInicial.value = iso || cal.selectedDay.value
  drawerOpen.value = true
}

function openEdit(e: CalendarEvent) {
  editing.value = e
  drawerOpen.value = true
}

function onVista(v: VistaCalendario) {
  cal.vista.value = v
}

function onPrev() {
  cal.goPrev()
  syncFilter()
}

function onNext() {
  cal.goNext()
  syncFilter()
}

function onToday() {
  cal.goToday()
  syncFilter()
}

onMounted(async () => {
  await cal.fetchRange()
  try {
    const cats = await listCategories(false)
    catOpts.value = (cats as any[]).map(c => ({ value: c.id, label: c.name }))
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudieron cargar categorías'), color: 'error' })
  }
})
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Calendario de presupuestos"
      :description="`${cal.titulo.value} · ${cal.count.value} eventos · ${formatMoney(cal.totalAmount.value, currency)}`"
      icon="i-lucide-calendar-days"
      :hide-search="true"
      create-label="Agendar"
      @create="openCreate()"
    >
      <template #actions>
        <UButton variant="outline" color="neutral" icon="i-lucide-wallet" label="Presupuestos" to="/presupuestos" />
      </template>
    </AppToolbar>

    <AppStatCards :stats="stats" :loading="cal.loading.value && !cal.range.value" :columns="3" />

    <UCard class="border border-default" :ui="{ body: 'p-4 flex flex-wrap items-center gap-2' }">
      <UInput v-model="fDay" type="number" :min="1" :max="maxDay" class="w-24" aria-label="Día" @change="aplicarSalto" />
      <USelectMenu v-model="fMonth" :items="monthItems" value-key="value" label-key="label" class="w-36" aria-label="Mes" @update:model-value="aplicarSalto" />
      <USelectMenu v-model="fYear" :items="yearItems" value-key="value" label-key="label" class="w-28" aria-label="Año" @update:model-value="aplicarSalto" />
      <UButton label="Ir" color="primary" variant="solid" size="sm" icon="i-lucide-calendar-check" @click="aplicarSalto" />
      <UButton label="Hoy" color="neutral" variant="outline" size="sm" @click="onToday" />
    </UCard>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2">
        <CalendarioPresupuestos
          :vista="cal.vista.value"
          :anchor="cal.anchor.value"
          :days="cal.days.value"
          :events="cal.events.value"
          :selected-day="cal.selectedDay.value"
          :loading="cal.loading.value"
          :currency="currency"
          @update:vista="onVista"
          @prev="onPrev"
          @next="onNext"
          @today="onToday"
          @select-day="cal.selectDay($event)"
          @select-event="openEdit($event)"
          @create-on-day="openCreate($event)"
        />
      </div>

      <UCard class="border border-default h-fit" :ui="{ header: 'py-3.5 px-5 border-b border-default bg-elevated/60', body: 'p-4 flex flex-col gap-2' }">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-highlighted">Eventos del {{ cal.selectedDay.value }}</span>
            <UButton size="xs" icon="i-lucide-plus" variant="ghost" @click="openCreate(cal.selectedDay.value)" />
          </div>
        </template>
        <template #default>
          <button
            v-for="e in cal.dayEvents.value" :key="e.id"
            class="rounded-xl border border-default border-l-4 bg-elevated/60 px-3 py-2 text-left hover:bg-elevated"
            :style="e.color ? { borderLeftColor: e.color } : {}"
            @click="openEdit(e)"
          >
            <p class="text-sm font-semibold text-highlighted truncate">{{ e.title }}</p>
            <p class="text-xs text-muted">{{ e.category.name }} · {{ formatMoney(e.amount, currency) }}</p>
          </button>
          <p v-if="!cal.dayEvents.value.length" class="text-sm text-muted text-center py-6">Sin eventos este día.</p>
        </template>
      </UCard>
    </div>

    <CalendarioEventoDrawer
      v-model:open="drawerOpen"
      :evento="editing"
      :dia-inicial="diaInicial"
      :categorias="catOpts"
      @refresh="cal.fetchRange(true)"
    />
  </div>
</template>
