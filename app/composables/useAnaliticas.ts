import {
  getAnalytics,
  type Analytics,
  type AnalyticsAlert,
  type AnalyticsCashflowPoint,
  type AnalyticsKpis,
  type AnalyticsLeakageItem,
  type AnalyticsQuery,
} from '~/services/reports.service'
import { getApiMessage } from '~/utils/api-error'
import { num } from '~/utils/format'

export type {
  Analytics,
  AnalyticsAlert,
  AnalyticsCashflowPoint,
  AnalyticsKpis,
  AnalyticsLeakageItem,
  AnalyticsQuery,
}

export const useAnaliticas = () => {
  const toast = useToast()
  const now = new Date()
  const filter = reactive({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    months: 6,
    savingsTargetPercent: 15,
  })

  const data = ref<Analytics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const cashflow = computed<AnalyticsCashflowPoint[]>(() => {
    const raw = (data.value as any)?.cashflow
    if (!Array.isArray(raw)) return []
    return raw
      .filter(r => r && typeof r.period === 'string')
      .map(r => ({
        period: String(r.period),
        income: num(r.income),
        expense: num(r.expense),
        net: num(r.net),
        saved: num(r.saved),
        budgetExpense: num(r.budgetExpense),
      }))
  })

  const kpis = computed<AnalyticsKpis>(() => {
    const k = (data.value as any)?.kpis ?? {}
    return {
      savingsRate: k.savingsRate == null ? null : num(k.savingsRate),
      savingsTargetPercent: num(k.savingsTargetPercent ?? filter.savingsTargetPercent),
      savingsGap: num(k.savingsGap),
      liquid: num(k.liquid),
      averageMonthlyExpense: num(k.averageMonthlyExpense),
      runwayMonths: num(k.runwayMonths),
      expenseDeviation: num(k.expenseDeviation),
      expenseMoM: k.expenseMoM == null ? null : num(k.expenseMoM),
      averageIncome: num(k.averageIncome),
    }
  })

  const leakage = computed<AnalyticsLeakageItem[]>(() => {
    const raw = (data.value as any)?.leakage
    if (!Array.isArray(raw)) return []
    return raw
      .filter(r => r && typeof r.name === 'string')
      .map(r => ({
        categoryId: String(r.categoryId ?? ''),
        name: String(r.name),
        actual: num(r.actual),
        budget: r.budget == null ? null : num(r.budget),
        variance: num(r.variance),
        percentOfExpense: num(r.percentOfExpense),
        status: String(r.status ?? ''),
      }))
      .sort((a, b) => b.actual - a.actual)
  })

  const alerts = computed<AnalyticsAlert[]>(() => {
    const raw = (data.value as any)?.alerts
    if (!Array.isArray(raw)) return []
    const rank = (s: string) => (s === 'high' ? 0 : 1)
    return raw
      .filter(r => r && typeof r.title === 'string')
      .map(r => ({
        categoryId: String(r.categoryId ?? ''),
        title: String(r.title),
        severity: String(r.severity ?? 'moderate'),
        actual: num(r.actual),
        budget: r.budget == null ? null : num(r.budget),
        overspend: num(r.overspend),
      }))
      .sort((a, b) => rank(a.severity) - rank(b.severity) || b.overspend - a.overspend)
  })

  async function fetchAnaliticas() {
    loading.value = true
    error.value = null
    try {
      data.value = await getAnalytics({
        year: filter.year,
        month: filter.month,
        months: filter.months,
        savingsTargetPercent: filter.savingsTargetPercent,
      })
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener analíticas')
      toast.add({ title: 'Error', description: error.value, color: 'error', icon: 'i-lucide-triangle-alert' })
    } finally {
      loading.value = false
    }
  }

  return {
    filter,
    data,
    loading,
    error,
    cashflow,
    kpis,
    leakage,
    alerts,
    fetchAnaliticas,
  }
}
