import {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  copyBudgets,
  getBudget,
  budgetHistory,
  recentAdjustments,
  getBudgetStats,
  getBudgetComparison,
  type Budget,
  type CreateBudget,
  type UpdateBudget,
  type BudgetAdjustment,
  type BudgetStats,
  type BudgetComparison,
  type BudgetComparisonItem,
} from '~/services/budgets.service'
import { getApiMessage } from '~/utils/api-error'

export type { Budget, CreateBudget, UpdateBudget, BudgetAdjustment, BudgetStats, BudgetComparison, BudgetComparisonItem }

export interface PresupuestoRow extends BudgetComparisonItem {
  budgetId?: string
}

export const usePresupuestos = () => {
  const toast = useToast()
  const now = new Date()
  const filter = reactive({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    buscar: undefined as string | undefined,
  })

  const items = ref<Budget[]>([])
  const comparison = ref<BudgetComparison | null>(null)
  const stats = ref<BudgetStats | null>(null)
  const item = ref<Budget | null>(null)
  const history = ref<BudgetAdjustment[]>([])
  const recent = ref<BudgetAdjustment[]>([])
  const loading = ref(false)
  const detalleLoading = ref(false)
  const error = ref<string | null>(null)

  const rows = computed<PresupuestoRow[]>(() => {
    const list = comparison.value?.items ?? []
    const byCat = new Map(items.value.map(b => [b.categoryId, b.id]))
    const q = filter.buscar?.trim().toLowerCase()
    return list
      .map(r => ({ ...r, budgetId: byCat.get(r.categoryId) }))
      .filter(r => !q || r.name.toLowerCase().includes(q))
  })

  const resumen = computed(() => {
    const t = stats.value?.totales
    const c = stats.value?.conteos
    return {
      planificado: t?.planificado ?? 0,
      ejecutado: t?.ejecutado ?? 0,
      restante: t?.restante ?? 0,
      tasaEjecucion: t?.tasaEjecucion ?? null as number | null,
      total: c?.total ?? 0,
      enOrden: c?.enOrden ?? 0,
      cercaLimite: c?.cercaLimite ?? 0,
      excedidos: c?.excedidos ?? 0,
      saldoNeto: comparison.value?.saldoNeto ?? 0,
      esDeficit: comparison.value?.esDeficit ?? false,
    }
  })

  function setPeriod(year: number, month: number) {
    filter.year = year
    filter.month = month
  }

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const params = { year: filter.year, month: filter.month }
      const [budgets, comp, st, rec] = await Promise.all([
        listBudgets(params),
        getBudgetComparison(params).catch(() => null),
        getBudgetStats(params).catch(() => null),
        recentAdjustments(14).catch(() => []),
      ])
      items.value = Array.isArray(budgets) ? budgets : []
      comparison.value = comp
      stats.value = st
      recent.value = Array.isArray(rec) ? rec : []
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener presupuestos')
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    detalleLoading.value = true
    try {
      item.value = await getBudget(id)
      return item.value
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo obtener el presupuesto'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return null
    } finally {
      detalleLoading.value = false
    }
  }

  async function fetchHistory(id: string) {
    try {
      const h = await budgetHistory(id)
      history.value = Array.isArray(h) ? h : []
      return history.value
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo obtener el historial'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return []
    }
  }

  async function fetchDetalle(id: string) {
    detalleLoading.value = true
    try {
      const [b, h] = await Promise.all([getBudget(id), budgetHistory(id).catch(() => [])])
      item.value = b
      history.value = Array.isArray(h) ? h : []
      return { budget: b, history: history.value }
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo obtener el detalle'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return { budget: null, history: [] as BudgetAdjustment[] }
    } finally {
      detalleLoading.value = false
    }
  }

  async function create(payload: CreateBudget) {
    try {
      const r = await createBudget(payload)
      toast.add({ title: 'Presupuesto creado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchAll()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al crear presupuesto'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: string, payload: UpdateBudget) {
    try {
      const r = await updateBudget(id, payload)
      toast.add({ title: 'Presupuesto ajustado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchAll()
      if (item.value?.id === id) await fetchDetalle(id)
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al ajustar presupuesto'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: string) {
    try {
      await deleteBudget(id)
      toast.add({ title: 'Presupuesto eliminado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchAll()
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo eliminar'), color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  async function copiarMesAnterior() {
    const from = new Date(filter.year, filter.month - 2, 1)
    try {
      const res = await copyBudgets({
        fromYear: from.getFullYear(),
        fromMonth: from.getMonth() + 1,
        toYear: filter.year,
        toMonth: filter.month,
      })
      toast.add({ title: 'Presupuestos copiados', description: `${res.created} creados, ${res.skipped} omitidos`, color: 'success', icon: 'i-lucide-circle-check' })
      await fetchAll()
      return res
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo copiar'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  function clearDetalle() {
    item.value = null
    history.value = []
  }

  return {
    items, comparison, stats, item, history, recent,
    loading, detalleLoading, error, filter, rows, resumen,
    setPeriod, fetchAll, fetchById, fetchHistory, fetchDetalle, clearDetalle,
    create, update, remove, copiarMesAnterior,
  }
}
