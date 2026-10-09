import {
  getCategoryBreakdown,
  getDebtsSnapshot,
  getOverview,
  getSavingsSnapshot,
  type CategoryBreakdown,
  type DebtsSnapshot,
  type Distribution,
  type Granularity,
  type IncomeVsBudget,
  type Kpis,
  type LedgerSummary,
  type MetodoPago,
  type Overview,
  type RangeQuery,
  type SavingsSnapshot,
  type Waterfall,
} from '~/services/dashboard.service'
import { DEFAULT_FILTERS, type CuentaOpt } from '~/types/dashboard'
import { monthYearLabel, num } from '~/utils/format'

export type { Granularity, MetodoPago }

export interface DashboardPeriod {
  year: number
  month: number
}

export function useDashboardData() {
  const now = new Date()
  const period = useState<DashboardPeriod>('dashboard-period', () => ({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }))
  const search = useState<string>('dashboard-search', () => DEFAULT_FILTERS.search)
  const accountId = useState<string | undefined>('dashboard-account-id', () => DEFAULT_FILTERS.accountId)
  const granularity = useState<Granularity>('dashboard-granularity', () => DEFAULT_FILTERS.granularity)
  const paymentMethod = useState<MetodoPago | undefined>('dashboard-payment-method', () => DEFAULT_FILTERS.paymentMethod)
  const breakdownCategoryId = useState<string | undefined>('dashboard-breakdown-category', () => undefined)

  // ---- /dashboard/* (única fuente de datos del dashboard) ----
  const rangeParams = computed<RangeQuery>(() => ({
    year: period.value.year,
    month: period.value.month,
    granularity: granularity.value,
    accountId: accountId.value,
    paymentMethod: paymentMethod.value,
  }))

  const {
    data: overview,
    pending: overviewPending,
    error: overviewError,
    refresh: refreshOverviewBase,
  } = useAsyncData<Overview>('dashboard-overview', () => getOverview(rangeParams.value), { watch: [rangeParams] })

  const {
    data: breakdown,
    pending: breakdownPending,
    refresh: refreshBreakdown,
  } = useAsyncData<CategoryBreakdown>(
    'dashboard-breakdown',
    () => getCategoryBreakdown({ ...rangeParams.value, categoryId: breakdownCategoryId.value }),
    { watch: [rangeParams, breakdownCategoryId] },
  )

  const {
    data: debts,
    pending: debtsPending,
    refresh: refreshDebts,
  } = useAsyncData<DebtsSnapshot>(
    'dashboard-debts',
    () => getDebtsSnapshot(rangeParams.value),
    { watch: [rangeParams] },
  )

  const {
    data: savings,
    pending: savingsPending,
    refresh: refreshSavings,
  } = useAsyncData<SavingsSnapshot>(
    'dashboard-savings',
    () => getSavingsSnapshot(rangeParams.value),
    { watch: [rangeParams] },
  )

  function refreshOverview() {
    return Promise.all([refreshOverviewBase(), refreshBreakdown(), refreshDebts(), refreshSavings()])
  }

  function limpiarFiltros() {
    granularity.value = DEFAULT_FILTERS.granularity
    accountId.value = DEFAULT_FILTERS.accountId
    paymentMethod.value = DEFAULT_FILTERS.paymentMethod
    search.value = DEFAULT_FILTERS.search
  }

  const kpis = computed<Kpis | null>(() => overview.value?.kpis ?? null)
  const liquidity = computed(() => kpis.value?.liquidity ?? null)
  const expenseDistribution = computed<Distribution | null>(() => overview.value?.distribution ?? null)
  const incomeVsBudget = computed<IncomeVsBudget | null>(() => overview.value?.incomeVsBudget ?? null)
  const waterfall = computed<Waterfall | null>(() => overview.value?.waterfall ?? null)
  const waterfallTotal = computed(() => num(waterfall.value?.total))
  const incomeSummary = computed<LedgerSummary | null>(() => overview.value?.incomeSummary ?? null)
  const expenseSummary = computed<LedgerSummary | null>(() => overview.value?.expenseSummary ?? null)

  const fallbackLabel = computed(() => monthYearLabel(period.value.year, period.value.month))
  const rangeLabel = computed(() => overview.value?.range.label || fallbackLabel.value)

  const hasRealMovements = computed(() => num(kpis.value?.income.total) !== 0 || num(kpis.value?.expense.total) !== 0)

  const accountOptions = computed<CuentaOpt[]>(() => [
    { value: undefined, label: 'Todas las cuentas' },
    ...(liquidity.value?.items ?? []).map(a => ({ value: a.id as string | undefined, label: a.name })),
  ])

  function shiftMonth(delta: number) {
    const next = new Date(period.value.year, period.value.month - 1 + delta, 1)
    period.value = { year: next.getFullYear(), month: next.getMonth() + 1 }
  }
  function goCurrent() {
    const current = new Date()
    period.value = { year: current.getFullYear(), month: current.getMonth() + 1 }
  }

  return {
    period,
    search,
    accountId,
    granularity,
    paymentMethod,
    breakdownCategoryId,
    overview,
    overviewPending,
    overviewError,
    refreshOverview,
    limpiarFiltros,
    kpis,
    liquidity,
    expenseDistribution,
    incomeVsBudget,
    waterfall,
    waterfallTotal,
    incomeSummary,
    expenseSummary,
    breakdown,
    breakdownPending,
    debts,
    debtsPending,
    savings,
    savingsPending,
    rangeLabel,
    hasRealMovements,
    accountOptions,
    prevMonth: () => shiftMonth(-1),
    nextMonth: () => shiftMonth(1),
    goCurrent,
  }
}
