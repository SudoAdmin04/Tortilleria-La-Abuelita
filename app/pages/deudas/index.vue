<script setup lang="ts">
import type { Debt } from '~/services/debts.service'
import { formatMoney } from '~/utils/format'

useHead({ title: 'Deudas' })

const { items, total, loading, resumen, stats: deudasStats, statsLoading, fetchPaginado, fetchStats, liquidar, remove, filter } = useDeudas()
const auth = useAuthStore()
const currency = computed(() => auth.user?.currency || 'MXN')

const search = ref('')
const formDrawerOpen = ref(false)
const editingDeuda = ref<Debt | null>(null)
const page = ref(1)
const pageCount = ref(10)

let searchTimer: ReturnType<typeof setTimeout> | undefined

const stats = computed(() => {
  const porPagar = deudasStats.value?.porPagar
  const porCobrar = deudasStats.value?.porCobrar
  const vivo = deudasStats.value?.saldoVivoVigente
  const vencidas = deudasStats.value?.vencidas
  const principal = vivo?.principal ?? 0
  return [
    {
      label: 'Por pagar (yo debo)',
      value: formatMoney(porPagar?.amount ?? 0, currency.value),
      sub: `${porPagar?.count ?? 0} ${(porPagar?.count ?? 0) === 1 ? 'vigente' : 'vigentes'}`,
      icon: 'i-lucide-trending-down',
      tone: 'danger' as const,
    },
    {
      label: 'Por cobrar (me deben)',
      value: formatMoney(porCobrar?.amount ?? 0, currency.value),
      sub: `${porCobrar?.count ?? 0} ${(porCobrar?.count ?? 0) === 1 ? 'vigente' : 'vigentes'}`,
      icon: 'i-lucide-trending-up',
      tone: 'success' as const,
    },
    {
      label: 'Saldo vivo vigente',
      value: formatMoney(vivo?.amount ?? 0, currency.value),
      sub: `Principal: ${formatMoney(principal, currency.value)}`,
      icon: 'i-lucide-scale',
      tone: 'primary' as const,
      progress: principal > 0 ? ((principal - (vivo?.amount ?? 0)) / principal) * 100 : null,
    },
    {
      label: 'Vencidas',
      value: `${vencidas?.count ?? 0}`,
      sub: `de ${vencidas?.totalVigentes ?? 0} vigentes`,
      icon: 'i-lucide-alarm-clock',
      tone: 'warning' as const,
    },
  ]
})

const conteos = computed(() => ({
  total: resumen.value.totalDeudas,
  open: resumen.value.vigentes,
  paid: resumen.value.liquidadas,
}))

function aplicarFiltros() {
  page.value = 1
  filter.pagina = 1
  fetchPaginado()
}

function limpiarFiltros() {
  search.value = ''
  filter.buscar = undefined
  filter.status = undefined
  filter.direction = undefined
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
  editingDeuda.value = null
  formDrawerOpen.value = true
}

function openEdit(deuda: Debt) {
  editingDeuda.value = deuda
  formDrawerOpen.value = true
}

async function handleSettle(deuda: Debt) {
  await liquidar(deuda.id)
}

async function handleDelete(id: string) {
  await remove(id)
}

function refreshAll() {
  return Promise.all([fetchPaginado(), fetchStats()])
}

onMounted(async () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  filter.status = undefined
  filter.direction = undefined
  await refreshAll()
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Deudas"
      :description="`Pasivos por pagar y por cobrar · ${total} registros`"
      search-placeholder="Buscar deuda por nombre o contraparte..."
      create-label="Nueva Deuda"
      @create="openCreate"
    />

    <AppStatCards :stats="stats" :loading="statsLoading && !deudasStats" :columns="4" />

    <DeudasFilters
      v-model:status="filter.status"
      v-model:direction="filter.direction"
      v-model:search="search"
      :conteos="conteos"
      @filtrar="aplicarFiltros"
      @limpiar="limpiarFiltros"
    />

    <DeudasTable
      :data="items"
      :loading="loading"
      :total="total"
      :currency="currency"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @edit="openEdit"
      @settle="handleSettle"
      @delete="handleDelete"
    />

    <DeudasDrawer
      v-model:open="formDrawerOpen"
      :deuda="editingDeuda"
      @refresh="refreshAll"
    />
  </div>
</template>
