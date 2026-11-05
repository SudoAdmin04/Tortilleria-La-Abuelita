<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.store'
import { usePermisosStore } from '~/stores/permisos.store'
import { monthYearLabel } from '~/utils/format'
import type { Overview } from '~/services/dashboard.service'
import type { ExportFormat, ExportGranularity, ExportPaymentMethod } from '~/services/exports.repository'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const route = useRoute()
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
const accountId = useState<string | undefined>('dashboard-account-id', () => undefined)
const granularity = useState<ExportGranularity>('dashboard-granularity', () => 'monthly')
const paymentMethod = useState<ExportPaymentMethod | undefined>('dashboard-payment-method', () => undefined)


const { data: dashboardOverview } = useNuxtData<Overview>('dashboard-overview')
const accountOptions = computed<{ value: string | undefined, label: string }[]>(() => [
  { value: undefined, label: 'Todas las cuentas' },
  ...((dashboardOverview.value as Overview | null)?.kpis?.liquidity?.items ?? []).map(a => ({ value: a.id as string | undefined, label: a.name })),
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

const { downloadDashboard, isExporting } = useExports()

const exporting = computed(() =>
  isExporting('dashboard', 'pdf') || isExporting('dashboard', 'xlsx'),
)

function descargarDashboard(format: ExportFormat) {
  return downloadDashboard(format, {
    year: period.value.year,
    month: period.value.month,
    granularity: granularity.value,
    accountId: accountId.value,
    paymentMethod: paymentMethod.value,
  })
}

const exportMenu = [
  [
    { label: 'PDF', icon: 'i-lucide-file-text', onSelect: () => descargarDashboard('pdf') },
    { label: 'Excel (XLSX)', icon: 'i-lucide-file-spreadsheet', onSelect: () => descargarDashboard('xlsx') },
  ],
]

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
  [{ label: 'Perfil de Usuario', icon: 'i-lucide-user-round', onSelect: () => navigateTo('/perfil') }],
  [{ label: 'Cerrar Sesión', icon: 'i-lucide-log-out', color: 'error' as const, onSelect: () => authStore.logout() }],
])
</script>

<template>
  <UDashboardNavbar class="py-2 bg-default">
    <template #left>
      <UDashboardNavbarToggle class="lg:hidden" />

      <div v-if="currentPageMeta" class="flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-sm flex items-center justify-center bg-primary/10 ring-1 ring-inset ring-primary/15">
          <UIcon :name="currentPageMeta.icon" class="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-highlighted">
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

        <UDropdownMenu :items="exportMenu" :content="{ align: 'end' }">
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="outline"
            :loading="exporting"
            trailing-icon="i-lucide-chevron-down"
          >
            <span class="hidden md:inline">Descargar Reporte</span>
          </UButton>
        </UDropdownMenu>

        <UButton
          v-if="puedeCrear"
          icon="i-lucide-circle-plus"
          @click="quickOpen = true"
        >
          <span class="hidden md:inline">Nueva Transacción</span>
        </UButton>

        <LayoutNotifications v-model:open="notificationsOpen" />

        <UColorModeButton color="neutral" variant="ghost" />

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
