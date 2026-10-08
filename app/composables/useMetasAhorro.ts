import { listSavingsGoals, savingsProgress, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, getSavingsGoal, type SavingsGoal, type CreateSavingsGoal, type UpdateSavingsGoal, type GoalProgress } from '~/services/savings-goals.service'

export const useMetasAhorro = () => {
  const toast = useToast()
  const items = ref<GoalProgress[]>([])
  const metas = ref<SavingsGoal[]>([])
  const item = ref<SavingsGoal | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined, year: new Date().getFullYear(), month: new Date().getMonth() + 1 })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const [prog, all] = await Promise.all([
        savingsProgress({ year: filter.year, month: filter.month }),
        listSavingsGoals(),
      ])
      metas.value = all as SavingsGoal[]
      const q = filter.buscar?.trim().toLowerCase()
      const filtrados = q ? (prog as GoalProgress[]).filter(p => p.goal.name.toLowerCase().includes(q)) : (prog as GoalProgress[])
      total.value = filtrados.length
      const start = (filter.pagina - 1) * filter.registros
      items.value = filtrados.slice(start, start + filter.registros)
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener metas'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getSavingsGoal(id)
    } catch (e: any) {
      error.value = e?.data?.message || 'Error al obtener meta'
    }
  }

  async function create(payload: CreateSavingsGoal) {
    try {
      const r = await createSavingsGoal(payload)
      toast.add({ title: 'Meta creada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al crear meta', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: string, payload: UpdateSavingsGoal) {
    try {
      const r = await updateSavingsGoal(id, payload)
      toast.add({ title: 'Meta actualizada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al actualizar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: string) {
    try {
      await deleteSavingsGoal(id)
      toast.add({ title: 'Meta eliminada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo eliminar', color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, metas, item, loading, error, total, filter, fetchPaginado, fetchById, create, update, remove }
}
