import {
  getBudgetOverview,
  type BudgetOverview,
} from '~/services/reports.service'
import type { BudgetLine } from '~/composables/useReportes'
import { getApiMessage } from '~/utils/api-error'
import { num } from '~/utils/format'

export type BudgetOverviewResponse = BudgetOverview

export interface BudgetTotals {
  planned: number
  executed: number
  remaining: number
  executionRate: number | null
}

export interface BudgetCounts {
  all: number
  within: number
  near: number
  exceeded: number
}

export interface BudgetOverviewQuery {
  year?: number
  month?: number
}

export const useResumenPresupuesto = () => {
  const toast = useToast()
  const now = new Date()
  const filter = reactive({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  })

  const data = ref<BudgetOverview | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totals = computed<BudgetTotals>(() => {
    const t = (data.value as any)?.totals ?? {}
    return {
      planned: num(t.planned),
      executed: num(t.executed),
      remaining: num(t.remaining),
      executionRate: t.executionRate == null ? null : num(t.executionRate),
    }
  })

  const counts = computed<BudgetCounts>(() => {
    const c = (data.value as any)?.counts ?? {}
    return {
      all: num(c.all),
      within: num(c.within),
      near: num(c.near),
      exceeded: num(c.exceeded),
    }
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

  const rubros = computed<BudgetLine[]>(() => {
    const raw = (data.value as any)?.rubros
    if (!Array.isArray(raw)) return []
    return raw.map(normalizeLine).sort((a, b) => b.actual - a.actual)
  })

  async function fetchResumen() {
    loading.value = true
    error.value = null
    try {
      data.value = await getBudgetOverview({ year: filter.year, month: filter.month })
    }
    catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener el resumen de presupuesto')
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
    counts,
    rubros,
    fetchResumen,
  }
}
