import { getDashboard } from '~/services/reports.service'
import type {
  BudgetLine,
  DashboardAccounts,
  DashboardLiabilities,
  DashboardReport,
  DashboardTotals,
  DistributionItem,
  WaterfallStep,
} from '~/types/dashboard'
import { EMPTY_ACCOUNTS as FALLBACK_ACCOUNTS, EMPTY_TOTALS as FALLBACK_TOTALS } from '~/types/dashboard'
import { monthYearLabel, num } from '~/utils/format'

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
  const search = useState<string>('dashboard-search', () => '')
  const accountId = useState<string | undefined>('dashboard-account-id', () => undefined)

  const { data, pending, error, refresh } = useAsyncData<DashboardReport>(
    'dashboard-report',
    () => getDashboard({ year: period.value.year, month: period.value.month }),
    { watch: [period] },
  )

  const totals = computed<DashboardTotals>(() => ({ ...FALLBACK_TOTALS, ...((data.value?.totals ?? {}) as Partial<DashboardTotals>) }))
  const accounts = computed<DashboardAccounts>(() => {
    const raw = (data.value?.accounts ?? {}) as Partial<DashboardAccounts>
    return { ...FALLBACK_ACCOUNTS, ...raw, items: raw.items ?? [] }
  })
  const liabilities = computed<DashboardLiabilities>(() => ({
    payable: num((data.value?.liabilities as Record<string, unknown> | undefined)?.payable),
    receivable: num((data.value?.liabilities as Record<string, unknown> | undefined)?.receivable),
  }))
  const netWorth = computed(() => num(data.value?.netWorth))
  const pendingTransactions = computed(() => num(data.value?.pendingTransactions))
  const distribution = computed<DistributionItem[]>(() => data.value?.distribution ?? [])
  const incomeRubros = computed<BudgetLine[]>(() => data.value?.incomeRubros ?? [])
  const expenseRubros = computed<BudgetLine[]>(() => data.value?.expenseRubros ?? [])
  const steps = computed<WaterfallStep[]>(() => {
    const wf = data.value?.waterfall as { steps?: WaterfallStep[] } | undefined
    return wf?.steps ?? []
  })
  const primaryAccount = computed(() => accounts.value.items.find(a => a.isPrimary) ?? accounts.value.items[0] ?? null)
  const hasMovements = computed(() => totals.value.income !== 0 || totals.value.expense !== 0)

  const periodLabel = computed(() => monthYearLabel(period.value.year, period.value.month))

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
    data,
    pending,
    error,
    refresh,
    totals,
    accounts,
    liabilities,
    netWorth,
    pendingTransactions,
    distribution,
    incomeRubros,
    expenseRubros,
    steps,
    primaryAccount,
    hasMovements,
    periodLabel,
    prevMonth: () => shiftMonth(-1),
    nextMonth: () => shiftMonth(1),
    goCurrent,
  }
}
