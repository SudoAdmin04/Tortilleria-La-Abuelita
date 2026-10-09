import {
  listSavingsGoals,
  savingsProgress,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoal,
  getSavingsGoalBalance,
  listSavingsGoalEntries,
  depositToGoal,
  withdrawFromGoal,
  removeSavingsGoalEntry,
  type SavingsGoal,
  type CreateSavingsGoal,
  type UpdateSavingsGoal,
  type GoalProgress,
  type SavingsGoalBalance,
  type SavingsGoalEntry,
  type DepositGoalPayload,
  type WithdrawGoalPayload,
} from '~/services/savings-goals.service'
import { getApiMessage } from '~/utils/api-error'

export type { SavingsGoal, GoalProgress, SavingsGoalBalance, SavingsGoalEntry, DepositGoalPayload, WithdrawGoalPayload }

export interface MetasResumen {
  totalMetas: number
  activas: number
  aportadoMes: number
  metaMes: number
  faltanteMes: number
  pctMes: number | null
  totalHistorico: number
  totalObjetivo: number
  ahorradoConObjetivo: number
  faltanteObjetivo: number
  pctObjetivo: number | null
  metasConObjetivo: number
  metasCompletadas: number
}

export const useMetasAhorro = () => {
  const toast = useToast()
  const items = ref<GoalProgress[]>([])
  const metas = ref<SavingsGoal[]>([])
  const item = ref<SavingsGoal | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined, year: new Date().getFullYear(), month: new Date().getMonth() + 1 })

  const progreso = ref<GoalProgress[]>([])

  const balance = ref<SavingsGoalBalance | null>(null)
  const entries = ref<SavingsGoalEntry[]>([])
  const balanceLoading = ref(false)
  const entriesLoading = ref(false)
  const movimientoLoading = ref(false)

  const resumen = computed<MetasResumen>(() => {
    const all = progreso.value
    const aportadoMes = all.reduce((s, p) => s + (p.contributed ?? 0), 0)
    const metaMes = all.reduce((s, p) => s + (p.monthlyTarget ?? 0), 0)
    const faltanteMes = all.reduce((s, p) => s + (p.remaining ?? 0), 0)
    const totalHistorico = all.reduce((s, p) => s + (p.totalContributed ?? 0), 0)
    /** El objetivo final de cada meta es su `targetAmount`; el progreso es el total aportado. */
    const conObjetivo = all.filter(p => p.goal.targetAmount != null)
    const totalObjetivo = conObjetivo.reduce((s, p) => s + (p.goal.targetAmount ?? 0), 0)
    const ahorradoConObjetivo = conObjetivo.reduce((s, p) => s + (p.totalContributed ?? 0), 0)
    const faltanteObjetivo = conObjetivo.reduce((s, p) => s + Math.max((p.goal.targetAmount ?? 0) - (p.totalContributed ?? 0), 0), 0)
    const metasCompletadas = conObjetivo.filter(p => (p.totalContributed ?? 0) >= (p.goal.targetAmount ?? 0)).length
    return {
      totalMetas: all.length,
      activas: all.filter(p => p.goal.isActive).length,
      aportadoMes,
      metaMes,
      faltanteMes,
      pctMes: metaMes > 0 ? (aportadoMes / metaMes) * 100 : null,
      totalHistorico,
      totalObjetivo,
      ahorradoConObjetivo,
      faltanteObjetivo,
      pctObjetivo: totalObjetivo > 0 ? (ahorradoConObjetivo / totalObjetivo) * 100 : null,
      metasConObjetivo: conObjetivo.length,
      metasCompletadas,
    }
  })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const [prog, all] = await Promise.all([
        savingsProgress({ year: filter.year, month: filter.month }),
        listSavingsGoals(),
      ])
      const lista = Array.isArray(prog) ? prog : []
      metas.value = Array.isArray(all) ? all : []
      progreso.value = lista
      const q = filter.buscar?.trim().toLowerCase()
      const filtrados = q
        ? lista.filter(p => p.goal.name.toLowerCase().includes(q))
        : lista
      total.value = filtrados.length
      const start = (filter.pagina - 1) * filter.registros
      items.value = filtrados.slice(start, start + filter.registros)
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener metas')
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getSavingsGoal(id)
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener meta')
    }
  }

  async function fetchBalance(id: string) {
    balanceLoading.value = true
    try {
      balance.value = await getSavingsGoalBalance(id)
      return balance.value
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al obtener saldo'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return null
    } finally {
      balanceLoading.value = false
    }
  }

  async function fetchEntries(id: string, params?: { from?: string, to?: string }) {
    entriesLoading.value = true
    try {
      entries.value = await listSavingsGoalEntries(id, params)
      return entries.value
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al obtener historial'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return []
    } finally {
      entriesLoading.value = false
    }
  }

  async function fetchDetalle(id: string) {
    const [b, list] = await Promise.all([fetchBalance(id), fetchEntries(id)])
    return { balance: b, entries: list }
  }

  async function create(payload: CreateSavingsGoal) {
    try {
      const r = await createSavingsGoal(payload)
      toast.add({ title: 'Meta creada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al crear meta'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: string, payload: UpdateSavingsGoal) {
    try {
      const r = await updateSavingsGoal(id, payload)
      toast.add({ title: 'Meta actualizada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al actualizar'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    return update(id, { isActive })
  }

  async function remove(id: string) {
    try {
      await deleteSavingsGoal(id)
      toast.add({ title: 'Meta eliminada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo eliminar'), color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  async function deposit(id: string, payload: DepositGoalPayload) {
    movimientoLoading.value = true
    try {
      const r = await depositToGoal(id, payload)
      toast.add({ title: 'Aporte registrado', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchPaginado(), fetchBalance(id), fetchEntries(id)])
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo registrar el aporte'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      movimientoLoading.value = false
    }
  }

  async function withdraw(id: string, payload: WithdrawGoalPayload) {
    movimientoLoading.value = true
    try {
      const r = await withdrawFromGoal(id, payload)
      toast.add({ title: 'Retiro registrado', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchPaginado(), fetchBalance(id), fetchEntries(id)])
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo registrar el retiro'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      movimientoLoading.value = false
    }
  }

  async function removeEntry(goalId: string, entryId: string) {
    try {
      await removeSavingsGoalEntry(goalId, entryId)
      toast.add({ title: 'Movimiento revertido', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchPaginado(), fetchBalance(goalId), fetchEntries(goalId)])
      return true
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo revertir el movimiento'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return false
    }
  }

  function clearDetalle() {
    balance.value = null
    entries.value = []
  }

  return {
    items, metas, item, loading, error, total, filter, resumen, progreso,
    balance, entries, balanceLoading, entriesLoading, movimientoLoading,
    fetchPaginado, fetchById, fetchBalance, fetchEntries, fetchDetalle, clearDetalle,
    create, update, toggleActive, remove, deposit, withdraw, removeEntry,
  }
}
