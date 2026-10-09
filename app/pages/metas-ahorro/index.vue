<script setup lang="ts">
import { listAccounts } from '~/services/accounts.service'
import { listCategories } from '~/services/categories.service'
import type { SavingsGoal } from '~/services/savings-goals.service'
import { monthYearLabel, formatMoney, formatExecution } from '~/utils/format'

const { items, metas, total, loading, resumen, fetchPaginado, remove, filter } = useMetasAhorro()
const auth = useAuthStore()
const currency = computed(() => auth.user?.currency || 'MXN')
const dash = useDashboardData()

const search = ref('')
const formDrawerOpen = ref(false)
const editingMeta = ref<SavingsGoal | null>(null)
const page = ref(1)
const pageCount = ref(10)
const cuentasOpts = ref<{ value: string; label: string }[]>([])
const catsOpts = ref<{ value: string; label: string }[]>([])

const movimientoOpen = ref(false)
const movimientoTipo = ref<'deposit' | 'withdraw'>('deposit')
const movimientoMeta = ref<SavingsGoal | null>(null)
const historialOpen = ref(false)
const historialGoalId = ref<string | null>(null)
const historialGoalName = computed(() =>
  metas.value.find(m => m.id === historialGoalId.value)?.name
  || items.value.find(p => p.goal.id === historialGoalId.value)?.goal.name
  || null,
)

const periodLabel = computed(() => monthYearLabel(filter.year, filter.month))

const stats = computed(() => [
  {
    label: 'Metas activas',
    value: `${resumen.value.activas} / ${resumen.value.totalMetas}`,
    sub: `${resumen.value.metasCompletadas} de ${resumen.value.metasConObjetivo} con objetivo completadas`,
    icon: 'i-lucide-trophy',
    tone: 'primary' as const,
  },
  {
    label: 'Objetivo final total',
    value: resumen.value.totalObjetivo > 0 ? formatMoney(resumen.value.totalObjetivo, currency.value) : '—',
    sub: `Ahorrado: ${formatMoney(resumen.value.ahorradoConObjetivo, currency.value)}`,
    icon: 'i-lucide-target',
    tone: 'success' as const,
    progress: resumen.value.totalObjetivo > 0 ? resumen.value.pctObjetivo : null,
  },
  {
    label: 'Avance al objetivo',
    value: formatExecution(resumen.value.pctObjetivo),
    sub: resumen.value.totalObjetivo > 0
      ? `Faltan ${formatMoney(resumen.value.faltanteObjetivo, currency.value)}`
      : 'Define un targetAmount por meta',
    icon: 'i-lucide-gauge',
    tone: 'warning' as const,
  },
  {
    label: `Aportado en ${periodLabel.value}`,
    value: formatMoney(resumen.value.aportadoMes, currency.value),
    sub: `Mensual: ${formatMoney(resumen.value.metaMes, currency.value)} · ${formatExecution(resumen.value.pctMes)}`,
    icon: 'i-lucide-piggy-bank',
    tone: 'neutral' as const,
  },
])

let searchTimer: ReturnType<typeof setTimeout> | undefined

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

watch(() => [dash.period.value.year, dash.period.value.month], ([y, m]) => {
  filter.year = y as number
  filter.month = m as number
  fetchPaginado()
})

function findMeta(id: string): SavingsGoal | null {
  return metas.value.find(m => m.id === id)
    || items.value.find(p => p.goal.id === id)?.goal
    || null
}

function openCreate() {
  editingMeta.value = null
  formDrawerOpen.value = true
}

function openEdit(id: string) {
  editingMeta.value = findMeta(id)
  formDrawerOpen.value = true
}

function openMovimiento(id: string, tipo: 'deposit' | 'withdraw') {
  movimientoMeta.value = findMeta(id)
  if (!movimientoMeta.value) return
  movimientoTipo.value = tipo
  movimientoOpen.value = true
}

function openHistorial(id: string) {
  historialGoalId.value = id
  historialOpen.value = true
}

async function handleDelete(id: string) {
  await remove(id)
}

function toArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  return (res as { items?: T[]; data?: T[] } | null)?.items
    ?? (res as { data?: T[] } | null)?.data
    ?? []
}

async function loadCatalogos() {
  try {
    const [acc, cats] = await Promise.all([listAccounts(), listCategories(false)])
    cuentasOpts.value = toArray<any>(acc).map(a => ({ value: a.id, label: a.name }))
    catsOpts.value = toArray<any>(cats).map(c => ({ value: c.id, label: c.name }))
  } catch {
    cuentasOpts.value = []
    catsOpts.value = []
  }
}

onMounted(async () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  filter.year = dash.period.value.year
  filter.month = dash.period.value.month
  await Promise.all([fetchPaginado(), loadCatalogos()])
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Metas de Ahorro"
      :description="`${periodLabel} · avance del mes`"
      search-placeholder="Buscar meta..."
      create-label="Nueva Meta"
      @create="openCreate"
    />

    <AppStatCards :stats="stats" :loading="loading" :columns="4" />

    <MetasAhorroList
      :data="items"
      :loading="loading"
      :total="total"
      :currency="currency"
      :cuentas="cuentasOpts"
      :categorias="catsOpts"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @edit="openEdit"
      @delete="handleDelete"
      @deposit="(id: string) => openMovimiento(id, 'deposit')"
      @withdraw="(id: string) => openMovimiento(id, 'withdraw')"
      @history="openHistorial"
    />

    <MetasAhorroDrawer
      v-model:open="formDrawerOpen"
      :meta="editingMeta"
      :cuentas="cuentasOpts"
      :categorias="catsOpts"
      @refresh="fetchPaginado"
    />

    <MetasAhorroMovimiento
      v-model:open="movimientoOpen"
      :goal="movimientoMeta"
      :tipo="movimientoTipo"
      :cuentas="cuentasOpts"
      @saved="fetchPaginado"
    />

    <MetasAhorroHistorial
      v-model:open="historialOpen"
      :goal-id="historialGoalId"
      :goal-name="historialGoalName"
      :currency="currency"
      @changed="fetchPaginado"
    />
  </div>
</template>
