<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.store'
import { usePermisosStore } from '~/stores/permisos.store'
import { listTransactions, type Transaction } from '~/services/transactions.service'
import { downloadCsv, monthRange, transactionsToCsv } from '~/utils/report-csv'
import { getApiMessage } from '~/utils/api-error'
import { monthYearLabel } from '~/utils/format'
import type { DashboardReport } from '~/types/dashboard'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const permisosStore = usePermisosStore()

if (import.meta.client && !permisosStore.pantallas.length) {
  permisosStore.loadFromStorage()
}

const normalizePath = (p: string | null | undefined) => {
  if (!p) return ''
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p
}

const currentPageMeta = computed(() => {
  if (import.meta.client && !permisosStore.pantallas.length) {
    permisosStore.loadFromStorage()
  }
  const path = normalizePath(route.path)
  const screens = permisosStore.pantallas

  const exact = screens.find(p => normalizePath(p.path) === path)
  if (exact) return { title: exact.screen, icon: exact.icon || 'i-lucide-layout-dashboard' }

  const prefix = screens
    .filter(p => (p.path ?? '') !== '/' && path.startsWith(normalizePath(p.path)))
    .sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0))[0]

  return prefix ? { title: prefix.screen, icon: prefix.icon || 'i-lucide-layout-dashboard' } : null
})

const now = new Date()
const period = useState<{ year: number, month: number }>('dashboard-period', () => ({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
}))
const search = useState<string>('dashboard-search', () => '')
const accountId = useState<string | undefined>('dashboard-account-id', () => undefined)


const { data: dashboardReport } = useNuxtData<DashboardReport>('dashboard-report')
const accountOptions = computed<{ value: string | undefined, label: string }[]>(() => [
  { value: undefined, label: 'Todas las cuentas' },
  ...((dashboardReport.value as any)?.accounts?.items ?? []).map((a: any) => ({ value: a.id, label: a.name })),
])

const showFilters = computed(() => route.path === '/dashboard')
const periodLabel = computed(() => monthYearLabel(period.value.year, period.value.month))

const monthOpen = ref(false)
const pickerYear = ref(period.value.year)
watch(monthOpen, v => { if (v) pickerYear.value = period.value.year })
function pickMonth(m: number) {
  period.value = { year: pickerYear.value, month: m }
  monthOpen.value = false
}
function goCurrentMonth() {
  const c = new Date()
  period.value = { year: c.getFullYear(), month: c.getMonth() + 1 }
  monthOpen.value = false
}

const downloading = ref(false)
async function downloadReport() {
  downloading.value = true
  try {
    const { from, to } = monthRange(period.value.year, period.value.month)
    const limit = 200
    let page = 1
    let pages = 1
    const all: Transaction[] = []
    do {
      const res = await listTransactions({
        page, limit, from, to,
        accountId: accountId.value || undefined,
        search: search.value.trim() || undefined,
        order: 'asc',
      })
      all.push(...res.items)
      pages = res.pages
      page++
    } while (page <= pages)
    if (!all.length) {
      toast.add({ title: 'Sin movimientos', description: 'No hay datos para el periodo y filtros actuales.', color: 'warning' })
      return
    }
    const mm = String(period.value.month).padStart(2, '0')
    downloadCsv(transactionsToCsv(all), `reporte-${period.value.year}-${mm}.csv`)
    toast.add({ title: 'Reporte descargado', description: `${all.length} movimientos exportados.`, color: 'success' })
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo descargar el reporte'), color: 'error' })
  } finally {
    downloading.value = false
  }
}

const puedeCrear = computed(() => permisosStore.can('/transacciones', 'canCreate'))
const quickOpen = ref(false)

const notificationsOpen = ref(false)
const userName = computed(() => authStore.user?.name || authStore.user?.email || 'Usuario')
const userEmail = computed(() => authStore.user?.email || '')
const initials = computed(() =>
  userName.value.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'U',
)
const avatarMenu = computed(() => [
  [{ label: userName.value, slot: 'account', disabled: true }],
  [{ label: 'Cerrar Sesión', icon: 'i-lucide-log-out', color: 'error' as const, onSelect: () => authStore.logout() }],
])
</script>

<template>
  <UDashboardNavbar class="py-2 bg-white dark:bg-neutral-900">
    <template #left>
      <UDashboardNavbarToggle class="lg:hidden" />

      <div v-if="currentPageMeta" class="flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-sm flex items-center justify-center bg-primary/20 dark:bg-primary-400/20">
          <UIcon :name="currentPageMeta.icon" class="w-7 h-7 text-primary-400" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
            {{ currentPageMeta.title }}
          </h1>
        </div>
      </div>
    </template>

    <template #right>
      <div class="flex items-center gap-2">
        <template v-if="showFilters">
          <UPopover v-model:open="monthOpen" :content="{ align: 'end' }">
            <UButton
              icon="i-lucide-calendar-days"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-chevron-down"
              class="hidden lg:inline-flex capitalize"
            >
              {{ periodLabel }}
            </UButton>
            <template #content>
              <div class="p-3 w-64">
                <div class="flex items-center justify-between mb-2">
                  <UButton icon="i-lucide-chevron-left" variant="ghost" color="neutral" square size="xs" aria-label="Año anterior" @click="pickerYear--" />
                  <span class="text-sm font-semibold">{{ pickerYear }}</span>
                  <UButton icon="i-lucide-chevron-right" variant="ghost" color="neutral" square size="xs" aria-label="Año siguiente" @click="pickerYear++" />
                </div>
                <div class="grid grid-cols-3 gap-1">
                  <UButton
                    v-for="(m, i) in MESES"
                    :key="m"
                    :label="m.slice(0, 3)"
                    size="xs"
                    :variant="pickerYear === period.year && i + 1 === period.month ? 'solid' : 'ghost'"
                    color="neutral"
                    block
                    @click="pickMonth(i + 1)"
                  />
                </div>
                <UButton label="Mes actual" variant="soft" color="neutral" size="xs" block class="mt-2" @click="goCurrentMonth()" />
              </div>
            </template>
          </UPopover>

          <USelect
            v-model="accountId"
            :items="accountOptions"
            icon="i-lucide-landmark"
            placeholder="Cuenta"
            class="hidden lg:block w-44"
          />
        </template>

        <UButton
          icon="i-lucide-download"
          color="neutral"
          variant="outline"
          :loading="downloading"
          @click="downloadReport()"
        >
          <span class="hidden md:inline">Descargar Reporte</span>
        </UButton>

        <UButton
          v-if="puedeCrear"
          icon="i-lucide-circle-plus"
          @click="quickOpen = true"
        >
          <span class="hidden md:inline">Nueva Transacción</span>
        </UButton>

        <LayoutNotifications v-model:open="notificationsOpen" />

        <USeparator orientation="vertical" class="h-8" color="primary" />

        <UDropdownMenu :items="avatarMenu" :content="{ align: 'end' }">
          <UButton color="neutral" variant="ghost" class="p-0.5 rounded-full" aria-label="Cuenta de usuario">
            <UAvatar :text="initials" :alt="userName" size="md" />
          </UButton>
          <template #account>
            <div class="text-left px-1 py-0.5">
              <p class="truncate text-sm font-semibold">{{ userName }}</p>
              <p class="truncate text-xs text-muted">{{ userEmail }}</p>
            </div>
          </template>
        </UDropdownMenu>
      </div>
    </template>
  </UDashboardNavbar>

  <LayoutQuickTransaction v-model:open="quickOpen" />
</template>
