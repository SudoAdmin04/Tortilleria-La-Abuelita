import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransaction,
  reconcileTransactions,
  getTransactionsSummary,
  getExpensesDistribution,
  getIncomeSources,
  type Transaction,
  type CreateTransaction,
  type UpdateTransaction,
  type TransactionFilters,
  type TransactionSummary,
  type SummaryFilters,
  type ExpenseDistribution,
  type IncomeSources,
} from '~/services/transactions.service'
import { getApiMessage } from '~/utils/api-error'

export type { Transaction, CreateTransaction, UpdateTransaction, TransactionFilters, TransactionSummary, SummaryFilters, ExpenseDistribution, IncomeSources }
export type TipoMovimiento = 'income' | 'expense' | 'transfer'
export type EstadoMovimiento = 'pending' | 'reconciled'
export type MetodoPago = 'bank_transfer' | 'debit_card' | 'credit_card' | 'cash'

export const useTransacciones = () => {
  const toast = useToast()
  const items = ref<Transaction[]>([])
  const item = ref<Transaction | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const pages = ref(1)
  const summary = ref<TransactionSummary | null>(null)
  const summaryLoading = ref(false)
  const gastos = ref<ExpenseDistribution | null>(null)
  const gastosLoading = ref(false)
  const ingresos = ref<IncomeSources | null>(null)
  const ingresosLoading = ref(false)
  const filter = reactive({
    pagina: 1,
    registros: 20,
    buscar: undefined as string | undefined,
    tipo: undefined as TipoMovimiento | undefined,
    estado: undefined as EstadoMovimiento | undefined,
    cuentaId: undefined as string | undefined,
    categoriaId: undefined as string | undefined,
    desde: undefined as string | undefined,
    hasta: undefined as string | undefined,
    metodoPago: undefined as MetodoPago | undefined,
  })

  function buildSummaryFilters(): SummaryFilters {
    return {
      from: filter.desde,
      to: filter.hasta,
      paymentMethod: filter.metodoPago,
      accountId: filter.cuentaId,
      categoryId: filter.categoriaId,
      search: filter.buscar?.trim() ? filter.buscar.trim() : undefined,
    }
  }

  async function fetchResumen() {
    summaryLoading.value = true
    try {
      summary.value = await getTransactionsSummary(buildSummaryFilters())
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener resumen')
    } finally {
      summaryLoading.value = false
    }
  }

  async function fetchGastos() {
    gastosLoading.value = true
    try {
      gastos.value = await getExpensesDistribution(buildSummaryFilters())
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener distribución de gastos')
    } finally {
      gastosLoading.value = false
    }
  }

  async function fetchIngresos() {
    ingresosLoading.value = true
    try {
      ingresos.value = await getIncomeSources(buildSummaryFilters())
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener fuentes de ingreso')
    } finally {
      ingresosLoading.value = false
    }
  }

  function fetchAnaliticas() {
    return Promise.all([fetchGastos(), fetchIngresos()])
  }

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listTransactions({
        page: filter.pagina,
        limit: filter.registros,
        type: filter.tipo,
        status: filter.estado,
        accountId: filter.cuentaId,
        categoryId: filter.categoriaId,
        from: filter.desde,
        to: filter.hasta,
        paymentMethod: filter.metodoPago,
        search: filter.buscar?.trim() ? filter.buscar.trim() : undefined,
      })
      items.value = res.items ?? []
      total.value = res.total ?? 0
      pages.value = res.pages ?? 1
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener transacciones')
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getTransaction(id)
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener movimiento')
    }
  }

  async function create(payload: CreateTransaction) {
    try {
      const r = await createTransaction(payload)
      toast.add({ title: 'Movimiento registrado', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchPaginado(), fetchResumen(), fetchAnaliticas()])
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al registrar movimiento'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: string, payload: UpdateTransaction) {
    try {
      const r = await updateTransaction(id, payload)
      toast.add({ title: 'Movimiento actualizado', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchPaginado(), fetchResumen(), fetchAnaliticas()])
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al actualizar'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function conciliar(id: string) {
    try {
      const r = await reconcileTransactions([id])
      toast.add({ title: r.updated > 0 ? 'Movimiento conciliado' : 'Sin cambios', description: r.updated > 0 ? undefined : 'Ya estaba conciliado', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchPaginado(), fetchResumen(), fetchAnaliticas()])
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo conciliar'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: string) {
    try {
      await deleteTransaction(id)
      toast.add({ title: 'Movimiento eliminado', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchPaginado(), fetchResumen(), fetchAnaliticas()])
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo eliminar'), color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, item, loading, error, total, pages, filter, summary, summaryLoading, gastos, gastosLoading, ingresos, ingresosLoading, fetchPaginado, fetchResumen, fetchGastos, fetchIngresos, fetchAnaliticas, fetchById, create, update, conciliar, remove }
}
