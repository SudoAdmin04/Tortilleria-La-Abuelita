<script setup lang="ts">
import type { Account } from '~/services/accounts.service'
import { formatMoney } from '~/utils/format'

useHead({ title: 'Cuentas' })

const { items, total, loading, resumen, summary, loadingSummary, distribucion, loadingDistribucion, conciliacion, loadingConciliacion, fetchPaginado, fetchInsights, remove, toggleActive, setPrimary, filter } = useCuentas()
const auth = useAuthStore()
const permisos = usePermisosStore()
const toast = useToast()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/cuentas', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/cuentas', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/cuentas', 'canDelete'))

const search = ref('')
const formDrawerOpen = ref(false)
const editingCuenta = ref<Account | null>(null)
const page = ref(1)
const pageCount = ref(9)

let searchTimer: ReturnType<typeof setTimeout> | undefined

const stats = computed(() => {
  const saldo = summary.value?.totalBalance ?? resumen.value.saldoTotal
  const activas = summary.value?.activeCount ?? resumen.value.activas
  const inactivas = summary.value?.inactiveCount ?? resumen.value.inactivas
  const totalCuentas = summary.value?.totalCount ?? resumen.value.totalCuentas
  const principalNombre = summary.value?.primary?.name ?? resumen.value.principal?.name ?? '—'
  const principalSaldo = summary.value?.primary
    ? formatMoney(summary.value.primary.balance, currency.value)
    : resumen.value.principal
      ? formatMoney(resumen.value.principal.balance, resumen.value.principal.currency || currency.value)
      : 'Sin principal seleccionada'
  return [
    {
      label: 'Saldo total (activas)',
      value: formatMoney(saldo, currency.value),
      sub: `${activas} ${activas === 1 ? 'cuenta activa' : 'cuentas activas'}`,
      icon: 'i-lucide-wallet',
      tone: 'success' as const,
    },
    {
      label: 'Cuentas',
      value: summary.value?.label ?? `${activas} / ${totalCuentas}`,
      sub: `${inactivas} inactivas`,
      icon: 'i-lucide-layers',
      tone: 'primary' as const,
    },
    {
      label: 'Cuenta principal',
      value: principalNombre,
      sub: principalSaldo,
      icon: 'i-lucide-star',
      tone: 'warning' as const,
    },
  ]
})

const statsLoading = computed(() => loading.value || loadingSummary.value)

const tipoItems = [
  { value: undefined, label: 'Todos los tipos' },
  { value: 'checking', label: 'Cheques' },
  { value: 'savings', label: 'Ahorro' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'credit_card', label: 'Tarjeta' },
]

const tipoLabel = computed(() => tipoItems.find(t => t.value === filter.tipo)?.label ?? 'Todas')

const hayFiltros = computed(() => !!filter.tipo || !!filter.soloActivas || (search.value.trim() !== ''))

const filtrosActivos = computed(() =>
  (filter.tipo ? 1 : 0) + (filter.soloActivas ? 1 : 0) + (search.value.trim() !== '' ? 1 : 0),
)

function aplicarFiltros() {
  page.value = 1
  filter.pagina = 1
  fetchPaginado()
}

function limpiarFiltros() {
  search.value = ''
  filter.buscar = undefined
  filter.tipo = undefined
  filter.soloActivas = false
  aplicarFiltros()
}

watch([page, pageCount], () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  fetchPaginado()
})

watch(search, (v) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    filter.pagina = 1
    filter.buscar = v?.trim() ? v.trim() : undefined
    fetchPaginado()
  }, 350)
})

function openCreate() {
  editingCuenta.value = null
  formDrawerOpen.value = true
}

function openEdit(cuenta: Account) {
  editingCuenta.value = cuenta
  formDrawerOpen.value = true
}

async function handleDelete(cuenta: Account) {
  await remove(cuenta.id)
  await fetchInsights()
}

async function handleToggleActive(cuenta: Account) {
  await toggleActive(cuenta)
  await fetchInsights()
}

async function handleRefresh() {
  await Promise.allSettled([fetchPaginado(), fetchInsights()])
}

async function handleSetPrimary(cuenta: Account) {
  await setPrimary(cuenta)
  await fetchInsights()
}

function handleImportExtracto() {
  toast.add({ title: 'Próximamente', description: 'La importación de extractos (CSV / OFX) aún no está disponible.', color: 'neutral', icon: 'i-lucide-file-up' })
}

onMounted(async () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  await Promise.allSettled([fetchPaginado(), fetchInsights()])
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Cuentas"
      description="Bancos, efectivo y tarjetas · balance calculado"
      search-placeholder="Buscar cuenta o institución..."
      :create-label="puedeCrear ? 'Nueva Cuenta' : undefined"
      @create="openCreate"
    />

    <section class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-chart-column" class="size-4 text-muted shrink-0" />
        <h2 class="text-sm font-bold text-highlighted tracking-wide">Resumen general</h2>
      </div>
      <AppStatCards :stats="stats" :loading="statsLoading" :columns="3" />
    </section>

    <UCard
      class="border border-default"
      :ui="{
        header: 'py-3 px-4 sm:px-5 border-b border-default bg-elevated/60',
        body: 'p-4 sm:p-5 flex flex-col gap-4',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-list-filter" class="size-4 text-muted shrink-0" />
            <span class="text-sm font-bold text-highlighted tracking-wide truncate">Filtros</span>
            <UBadge v-if="filtrosActivos > 0" color="primary" variant="subtle" size="sm" class="font-semibold shrink-0">
              {{ filtrosActivos }} activo{{ filtrosActivos === 1 ? '' : 's' }}
            </UBadge>
          </div>
          <UButton
            v-if="hayFiltros"
            color="neutral"
            variant="soft"
            size="xs"
            label="Limpiar filtros"
            class="shrink-0 text-muted hover:text-highlighted"
            @click="limpiarFiltros"
          />
        </div>
      </template>

      <div class="flex flex-wrap items-center gap-1.5 rounded-xl bg-elevated/60 border border-muted p-1.5 w-fit max-w-full">
        <UButton
          v-for="t in tipoItems"
          :key="t.label"
          size="sm"
          :color="filter.tipo === t.value ? 'primary' : 'neutral'"
          :variant="filter.tipo === t.value ? 'solid' : 'ghost'"
          class="rounded-lg font-semibold"
          @click="() => { filter.tipo = t.value as typeof filter.tipo; aplicarFiltros() }"
        >
          <span class="flex items-center gap-1.5">
            {{ t.label }}
          </span>
        </UButton>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormField label="Tipo de cuenta" size="sm" class="w-full">
          <USelectMenu
            v-model="filter.tipo"
            :items="tipoItems"
            value-key="value"
            label-key="label"
            placeholder="Todos los tipos"
            icon="i-lucide-layers"
            size="md"
            class="w-full"
            @update:model-value="aplicarFiltros"
          />
        </UFormField>
        <UFormField label="Visibilidad" size="sm" class="w-full">
          <div class="flex items-center gap-2 rounded-lg border border-default bg-elevated/60 px-3 py-2">
            <USwitch v-model="filter.soloActivas" @update:model-value="aplicarFiltros" />
            <span class="text-xs text-muted font-medium">Solo activas</span>
            <span class="ml-auto text-[11px] text-dimmed font-medium truncate">{{ tipoLabel }}</span>
          </div>
        </UFormField>
      </div>
    </UCard>

    <section class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-wallet" class="size-4 text-toned shrink-0" />
        <h2 class="text-xs font-semibold uppercase tracking-widest text-highlighted">Mis cuentas</h2>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <div class="min-w-0 space-y-3">
          <CuentasCards
            :data="items"
            :loading="loading"
            :currency="currency"
            :puede-editar="puedeEditar"
            :puede-eliminar="puedeEliminar"
            @edit="openEdit"
            @delete="handleDelete"
            @toggle-active="handleToggleActive"
            @set-primary="handleSetPrimary"
          />

          <div v-if="total > pageCount || page > 1" class="flex items-center justify-end gap-4 text-xs">
            <span class="text-muted font-medium">
              Mostrando {{ (page - 1) * pageCount + 1 }}-{{ Math.min(page * pageCount, total) }} de {{ total }} cuentas
            </span>
            <UPagination
              v-model:page="page"
              :items-per-page="pageCount"
              :total="total"
              size="xs"
            />
          </div>
        </div>

        <aside class="flex flex-col gap-4 min-w-0">
          <CuentasAssetsDistribution
            :data="distribucion"
            :loading="loadingDistribucion"
            :currency="currency"
          />
          <CuentasReconciliation
            :data="conciliacion"
            :loading="loadingConciliacion"
            @import="handleImportExtracto"
          />
        </aside>
      </div>
    </section>

    <CuentasDrawer
      v-model:open="formDrawerOpen"
      :cuenta="editingCuenta"
      @refresh="handleRefresh"
    />
  </div>
</template>
