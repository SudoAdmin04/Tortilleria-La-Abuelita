import { listDebts, createDebt, updateDebt, deleteDebt, settleDebt, getDebt, type Debt, type CreateDebt, type UpdateDebt } from '~/services/debts.service'

export const useDeudas = () => {
  const toast = useToast()
  const items = ref<Debt[]>([])
  const item = ref<Debt | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined, status: undefined as 'open' | 'paid' | undefined })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listDebts(filter.status)
      const q = filter.buscar?.trim().toLowerCase()
      const filtrados = q
        ? (res as Debt[]).filter(d => d.name.toLowerCase().includes(q) || (d.counterparty || '').toLowerCase().includes(q))
        : (res as Debt[])
      total.value = filtrados.length
      const start = (filter.pagina - 1) * filter.registros
      items.value = filtrados.slice(start, start + filter.registros)
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener deudas'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getDebt(id)
    } catch (e: any) {
      error.value = e?.data?.message || 'Error al obtener deuda'
    }
  }

  async function create(payload: CreateDebt) {
    try {
      const r = await createDebt(payload)
      toast.add({ title: 'Deuda creada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al crear deuda', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: string, payload: UpdateDebt) {
    try {
      const r = await updateDebt(id, payload)
      toast.add({ title: 'Deuda actualizada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al actualizar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function liquidar(id: string) {
    try {
      const r = await settleDebt(id)
      toast.add({ title: 'Deuda liquidada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo liquidar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: string) {
    try {
      await deleteDebt(id)
      toast.add({ title: 'Deuda eliminada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo eliminar', color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, item, loading, error, total, filter, fetchPaginado, fetchById, create, update, liquidar, remove }
}
