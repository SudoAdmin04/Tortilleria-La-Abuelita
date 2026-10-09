import {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccount,
  getAccountsSummary,
  getAssetsDistribution,
  getReconciliation,
  type Account,
  type AccountSummary,
  type AssetsDistribution,
  type Reconciliation,
  type CreateAccount,
  type UpdateAccount,
  type AccountType,
} from '~/services/accounts.service'
import { getApiMessage } from '~/utils/api-error'

export type { Account, AccountSummary, AssetsDistribution, Reconciliation, CreateAccount, UpdateAccount, AccountType }

export interface CuentasResumen {
  totalCuentas: number
  activas: number
  inactivas: number
  /** Suma de `balance` de las cuentas activas. */
  saldoTotal: number
  /** Cuenta marcada como principal (si hay). */
  principal: Account | null
}

export type TipoCuentaFiltro = AccountType | undefined

export const useCuentas = () => {
  const toast = useToast()
  /** Página actual (ya filtrada/paginada en cliente). */
  const items = ref<Account[]>([])
  /** Catálogo completo (para selects y resumen). */
  const todas = ref<Account[]>([])
  const item = ref<Account | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  /** Resumen del backend (`GET /accounts/summary`) para las stat cards. */
  const summary = ref<AccountSummary | null>(null)
  const loadingSummary = ref(false)
  /** Distribución de activos (`GET /accounts/assets-distribution`). */
  const distribucion = ref<AssetsDistribution | null>(null)
  const loadingDistribucion = ref(false)
  /** Estado de conciliación (`GET /accounts/reconciliation`). */
  const conciliacion = ref<Reconciliation | null>(null)
  const loadingConciliacion = ref(false)
  const filter = reactive({
    pagina: 1,
    registros: 9,
    buscar: undefined as string | undefined,
    tipo: undefined as TipoCuentaFiltro,
    soloActivas: false,
  })

  const resumen = computed<CuentasResumen>(() => {
    const all = todas.value
    const activas = all.filter(a => a.isActive)
    return {
      totalCuentas: all.length,
      activas: activas.length,
      inactivas: all.length - activas.length,
      saldoTotal: activas.reduce((s, a) => s + (a.balance ?? 0), 0),
      principal: all.find(a => a.isPrimary) ?? null,
    }
  })

  function aplicarFiltros(lista: Account[]): Account[] {
    const q = filter.buscar?.trim().toLowerCase()
    return lista.filter((a) => {
      if (filter.soloActivas && !a.isActive) return false
      if (filter.tipo && a.type !== filter.tipo) return false
      if (q && !`${a.name} ${(a.institution || '')}`.toLowerCase().includes(q)) return false
      return true
    })
  }

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listAccounts()
      const lista = Array.isArray(res) ? res : []
      todas.value = lista
      const filtradas = aplicarFiltros(lista)
      total.value = filtradas.length
      const start = (filter.pagina - 1) * filter.registros
      items.value = filtradas.slice(start, start + filter.registros)
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener cuentas')
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getAccount(id)
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener cuenta')
    }
  }

  async function fetchSummary() {
    loadingSummary.value = true
    try {
      summary.value = await getAccountsSummary()
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener resumen')
    } finally {
      loadingSummary.value = false
    }
  }

  async function fetchDistribucion() {
    loadingDistribucion.value = true
    try {
      distribucion.value = await getAssetsDistribution()
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener distribución')
    } finally {
      loadingDistribucion.value = false
    }
  }

  async function fetchConciliacion() {
    loadingConciliacion.value = true
    try {
      conciliacion.value = await getReconciliation()
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener conciliación')
    } finally {
      loadingConciliacion.value = false
    }
  }

  /** Carga summary + distribución + conciliación en paralelo (widgets laterales). */
  async function fetchInsights() {
    await Promise.allSettled([fetchSummary(), fetchDistribucion(), fetchConciliacion()])
  }

  async function create(payload: CreateAccount) {
    try {
      const r = await createAccount(payload)
      toast.add({ title: 'Cuenta creada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al crear cuenta'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: string, payload: UpdateAccount) {
    try {
      const r = await updateAccount(id, payload)
      toast.add({ title: 'Cuenta actualizada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al actualizar'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  /**
   * Activa/desactiva sin borrar (recomendado si ya tiene movimientos).
   * El DTO exige `currency` + `initialBalance`: se reenvían los actuales.
   */
  async function toggleActive(cuenta: Account) {
    return update(cuenta.id, {
      currency: cuenta.currency,
      initialBalance: cuenta.initialBalance,
      isActive: !cuenta.isActive,
    })
  }

  /** Marca como principal (el backend desmarca la anterior). */
  async function setPrimary(cuenta: Account) {
    return update(cuenta.id, {
      currency: cuenta.currency,
      initialBalance: cuenta.initialBalance,
      isPrimary: true,
    })
  }

  async function remove(id: string) {
    try {
      await deleteAccount(id)
      toast.add({ title: 'Cuenta eliminada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Si tiene movimientos, desactívala en lugar de eliminarla'), color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, todas, item, loading, error, total, filter, resumen, summary, loadingSummary, distribucion, loadingDistribucion, conciliacion, loadingConciliacion, fetchPaginado, fetchById, fetchSummary, fetchDistribucion, fetchConciliacion, fetchInsights, create, update, toggleActive, setPrimary, remove }
}
