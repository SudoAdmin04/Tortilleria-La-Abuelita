import {
  listProduction,
  createProduction,
  getProduction,
  cancelProduction,
  type Production,
  type CreateProduction,
  type ProductionStatus,
} from '~/services/production.service'
import { getApiMessage } from '~/utils/api-error'

export type { Production, CreateProduction, ProductionStatus }

export const useProduccion = () => {
  const toast = useToast()
  const items = ref<Production[]>([])
  const detalle = ref<Production | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const loadingDetalle = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({
    page: 1,
    limit: 10,
    productId: undefined as string | undefined,
    status: undefined as ProductionStatus | undefined,
    from: undefined as string | undefined,
    to: undefined as string | undefined,
  })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listProduction({ ...filter })
      items.value = res.items
      total.value = res.total
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener lotes de producción')
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loadingDetalle.value = true
    try {
      detalle.value = await getProduction(id)
      return detalle.value
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar el lote'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      loadingDetalle.value = false
    }
  }

  async function create(payload: CreateProduction) {
    saving.value = true
    try {
      const r = await createProduction(payload)
      toast.add({ title: 'Producción registrada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo registrar la producción'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  async function cancel(id: string) {
    try {
      const r = await cancelProduction(id)
      toast.add({ title: 'Producción cancelada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cancelar el lote'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  return { items, detalle, loading, saving, loadingDetalle, error, total, filter, fetchPaginado, fetchById, create, cancel }
}
