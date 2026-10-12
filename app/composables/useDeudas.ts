import {
  listDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  settleDebt,
  getDebt,
  getDebtsStats,
  type Debt,
  type CreateDebt,
  type UpdateDebt,
  type DebtStatus,
  type DebtDirection,
  type DebtStats,
} from '~/services/debts.service'
import { getApiMessage } from '~/utils/api-error'

export type { Debt, CreateDebt, UpdateDebt, DebtStatus, DebtDirection, DebtStats }
export type DebtStatusFiltro = DebtStatus | undefined
export type DebtDirectionFiltro = DebtDirection | undefined

export interface DeudasResumen {
  totalDeudas: number
  vigentes: number
  liquidadas: number
  vencidas: number
  porPagar: number
  porCobrar: number
  porPagarCount: number
  porCobrarCount: number
  principalVigente: number
  amortizado: number
  pctAmortizado: number | null
}

function hoyISO(): string {
  const d = new Date()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function isVencida(deuda: Debt, hoy = hoyISO()): boolean {
  return deuda.status === 'open' && !!deuda.dueDate && deuda.dueDate < hoy
}

export const useDeudas = () => {
  const toast = useToast()
  const items = ref<Debt[]>([])
  const todas = ref<Debt[]>([])
  const item = ref<Debt | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const stats = ref<DebtStats | null>(null)
  const statsLoading = ref(false)
  const filter = reactive({
    pagina: 1,
    registros: 10,
    buscar: undefined as string | undefined,
    status: undefined as DebtStatusFiltro,
    direction: undefined as DebtDirectionFiltro,
  })

  const resumen = computed<DeudasResumen>(() => {
    const all = todas.value
    const vigentes = all.filter(d => d.status === 'open')
    const porPagarList = vigentes.filter(d => d.direction === 'payable')
    const porCobrarList = vigentes.filter(d => d.direction === 'receivable')
    const porPagar = porPagarList.reduce((s, d) => s + (d.outstanding ?? 0), 0)
    const porCobrar = porCobrarList.reduce((s, d) => s + (d.outstanding ?? 0), 0)
    const principalVigente = vigentes.reduce((s, d) => s + (d.principalAmount ?? 0), 0)
    const amortizado = vigentes.reduce((s, d) => s + (d.paidAmount ?? 0), 0)
    return {
      totalDeudas: all.length,
      vigentes: vigentes.length,
      liquidadas: all.length - vigentes.length,
      vencidas: vigentes.filter(d => isVencida(d)).length,
      porPagar,
      porCobrar,
      porPagarCount: porPagarList.length,
      porCobrarCount: porCobrarList.length,
      principalVigente,
      amortizado,
      pctAmortizado: principalVigente > 0 ? (amortizado / principalVigente) * 100 : null,
    }
  })

  function aplicarFiltros(lista: Debt[]): Debt[] {
    const q = filter.buscar?.trim().toLowerCase()
    return lista.filter((d) => {
      if (filter.status && d.status !== filter.status) return false
      if (filter.direction && d.direction !== filter.direction) return false
      if (q && !`${d.name} ${d.counterparty || ''} ${d.reference || ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listDebts()
      const lista = Array.isArray(res) ? res : []
      todas.value = lista
      const filtradas = aplicarFiltros(lista)
      total.value = filtradas.length
      const start = (filter.pagina - 1) * filter.registros
      items.value = filtradas.slice(start, start + filter.registros)
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener deudas')
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getDebt(id)
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener deuda')
    }
  }

  async function fetchStats() {
    statsLoading.value = true
    try {
      stats.value = await getDebtsStats()
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener estadísticas')
    } finally {
      statsLoading.value = false
    }
  }

  async function refreshAll() {
    await Promise.all([fetchPaginado(), fetchStats()])
  }

  async function create(payload: CreateDebt) {
    try {
      const r = await createDebt(payload)
      toast.add({ title: 'Deuda creada', color: 'success', icon: 'i-lucide-circle-check' })
      await refreshAll()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al crear deuda'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: string, payload: UpdateDebt) {
    try {
      const r = await updateDebt(id, payload)
      toast.add({ title: 'Deuda actualizada', color: 'success', icon: 'i-lucide-circle-check' })
      await refreshAll()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al actualizar'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function liquidar(id: string) {
    try {
      const r = await settleDebt(id)
      toast.add({ title: 'Deuda liquidada', color: 'success', icon: 'i-lucide-circle-check' })
      await refreshAll()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo liquidar'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: string) {
    try {
      await deleteDebt(id)
      toast.add({ title: 'Deuda eliminada', color: 'success', icon: 'i-lucide-circle-check' })
      await refreshAll()
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Si tiene movimientos vinculados, líquidala en lugar de eliminarla'), color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, todas, item, loading, error, total, filter, resumen, stats, statsLoading, fetchPaginado, fetchById, fetchStats, refreshAll, create, update, liquidar, remove }
}
