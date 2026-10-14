import {
  getDashboard,
  type BudgetOverview,
  type Dashboard,
} from '~/services/reports.service'
import type { components } from '~/types/api'
import { getApiMessage } from '~/utils/api-error'
import { num } from '~/utils/format'

export type DashboardResponse = Dashboard
export type BudgetLine = components['schemas']['BudgetLineResponseDto']
export type DistributionItem = components['schemas']['DistributionItemResponseDto']
export type Period = components['schemas']['PeriodResponseDto']

export interface DashboardTotals {
  income: number
  incomeBudget: number
  incomeVariance: number
  incomeExecutionRate: number | null
  expense: number
  expenseBudget: number
  expenseVariance: number
  expenseExecutionRate: number | null
  net: number
  isDeficit: boolean
  saved: number
  debtPayments: number
}

export interface DashboardAccountItem {
  id: string
  name: string
  type: string
  isPrimary: boolean
  balance: number
}

export interface DashboardAccounts {
  items: DashboardAccountItem[]
  liquid: number
  total: number
}

export interface DashboardLiabilities {
  payable: number
  receivable: number
}

export interface WaterfallStep {
  label: string
  type: string
  amount: number
  start: number
  end: number
}

export interface Waterfall {
  steps: WaterfallStep[]
}

export interface DashboardQuery {
  year?: number
  month?: number
}

export const useReportes = () => {
  const toast = useToast()
  const now = new Date()
  const filter = reactive({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  })

  const data = ref<Dashboard | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totals = computed<DashboardTotals>(() => {
    const t = (data.value as any)?.totals ?? {}
    return {
      income: num(t.income),
      incomeBudget: num(t.incomeBudget),
      incomeVariance: num(t.incomeVariance),
      incomeExecutionRate: t.incomeExecutionRate == null ? null : num(t.incomeExecutionRate),
      expense: num(t.expense),
      expenseBudget: num(t.expenseBudget),
      expenseVariance: num(t.expenseVariance),
      expenseExecutionRate: t.expenseExecutionRate == null ? null : num(t.expenseExecutionRate),
      net: num(t.net),
      isDeficit: Boolean(t.isDeficit),
      saved: num(t.saved),
      debtPayments: num(t.debtPayments),
    }
  })

  const accounts = computed<DashboardAccounts>(() => {
    const a = (data.value as any)?.accounts ?? {}
    const raw = Array.isArray(a.items) ? a.items : []
    return {
      items: raw
        .filter((r: any) => r && typeof r.name === 'string')
        .map((r: any) => ({
          id: String(r.id ?? ''),
          name: String(r.name),
          type: String(r.type ?? ''),
          isPrimary: Boolean(r.isPrimary),
          balance: num(r.balance),
        })),
      liquid: num(a.liquid),
      total: num(a.total),
    }
  })

  const liabilities = computed<DashboardLiabilities>(() => {
    const l = (data.value as any)?.liabilities ?? {}
    return {
      payable: num(l.payable),
      receivable: num(l.receivable),
    }
  })

  const netWorth = computed(() => num((data.value as any)?.netWorth))
  const pendingTransactions = computed(() => num((data.value as any)?.pendingTransactions))

  const distribution = computed<DistributionItem[]>(() => {
    const raw = (data.value as any)?.distribution
    if (!Array.isArray(raw)) return []
    return raw
      .filter((r: any) => r && typeof r.name === 'string')
      .map((r: any) => ({
        categoryId: String(r.categoryId ?? ''),
        name: String(r.name),
        kind: String(r.kind ?? ''),
        color: (r.color as string | null) ?? null,
        amount: num(r.amount),
        percent: num(r.percent),
      }))
      .sort((x: DistributionItem, y: DistributionItem) => y.amount - x.amount)
  })

  const normalizeLine = (r: any): BudgetLine => ({
    categoryId: String(r.categoryId ?? ''),
    name: String(r.name ?? ''),
    kind: String(r.kind ?? ''),
    icon: (r.icon as string | null) ?? null,
    color: (r.color as string | null) ?? null,
    budget: num(r.budget),
    actual: num(r.actual),
    variance: num(r.variance),
    executionRate: r.executionRate == null ? null : num(r.executionRate),
    status: String(r.status ?? ''),
    items: Array.isArray(r.items) ? r.items.map(normalizeLine) : undefined,
  })

  const incomeRubros = computed<BudgetLine[]>(() => {
    const raw = (data.value as any)?.incomeRubros
    if (!Array.isArray(raw)) return []
    return raw.map(normalizeLine).sort((x, y) => y.actual - x.actual)
  })

  const expenseRubros = computed<BudgetLine[]>(() => {
    const raw = (data.value as any)?.expenseRubros
    if (!Array.isArray(raw)) return []
    return raw.map(normalizeLine).sort((x, y) => y.actual - x.actual)
  })

  const waterfall = computed<Waterfall>(() => {
    const steps = (data.value as any)?.waterfall?.steps
    if (!Array.isArray(steps)) return { steps: [] }
    return {
      steps: steps
        .filter((s: any) => s && typeof s.label === 'string')
        .map((s: any) => ({
          label: String(s.label),
          type: String(s.type ?? ''),
          amount: num(s.amount),
          start: num(s.start),
          end: num(s.end),
        })),
    }
  })

  async function fetchReportes() {
    loading.value = true
    error.value = null
    try {
      data.value = await getDashboard({ year: filter.year, month: filter.month })
    }
    catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener el resumen')
      toast.add({ title: 'Error', description: error.value, color: 'error', icon: 'i-lucide-triangle-alert' })
    }
    finally {
      loading.value = false
    }
  }

  return {
    filter,
    data,
    loading,
    error,
    totals,
    accounts,
    liabilities,
    netWorth,
    pendingTransactions,
    distribution,
    incomeRubros,
    expenseRubros,
    waterfall,
    fetchReportes,
  }
}
