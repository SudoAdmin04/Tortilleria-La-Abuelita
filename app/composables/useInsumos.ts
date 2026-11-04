import {
  listSupplies,
  listSuppliesPaginado,
  createSupply,
  updateSupply,
  deleteSupply,
  toggleSupplyActive,
  getSupply,
  type Supply,
  type CreateSupply,
  type UpdateSupply,
} from '~/services/supplies.service'
import { getApiMessage } from '~/utils/api-error'

export type { Supply, CreateSupply, UpdateSupply }

export const useInsumos = () => {
  const toast = useToast()
  const items = ref<Supply[]>([])
  const item = ref<Supply | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({
    pagina: 1,
    registros: 10,
    buscar: undefined as string | undefined,
    isActive: undefined as boolean | undefined,
    lowStock: undefined as boolean | undefined,
  })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listSuppliesPaginado({
        pagina: filter.pagina,
        registros: filter.registros,
        buscar: filter.buscar,
        isActive: filter.isActive,
        lowStock: filter.lowStock,
      })
      items.value = res.data
      total.value = res.total
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener insumos')
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    try {
      return await listSupplies()
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener insumos')
      return [] as Supply[]
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getSupply(id)
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener insumo')
    }
  }

  async function create(payload: CreateSupply) {
    saving.value = true
    try {
      const r = await createSupply(payload)
      toast.add({ title: 'Insumo creado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al crear insumo'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  async function update(id: string, payload: UpdateSupply) {
    saving.value = true
    try {
      const r = await updateSupply(id, payload)
      toast.add({ title: 'Insumo actualizado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al actualizar insumo'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  async function toggleActivo(id: string) {
    try {
      const r = await toggleSupplyActive(id)
      toast.add({ title: r.isActive ? 'Insumo activado' : 'Insumo desactivado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cambiar el estado'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: string) {
    try {
      await deleteSupply(id)
      toast.add({ title: 'Insumo eliminado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Si tiene movimientos o recetas, desactívalo'), color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, item, loading, saving, error, total, filter, fetchPaginado, fetchAll, fetchById, create, update, toggleActivo, remove }
}
