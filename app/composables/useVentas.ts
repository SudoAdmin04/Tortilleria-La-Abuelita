import {
  listSales,
  createSale,
  getSale,
  cancelSale,
  type Sale,
  type CreateSale,
  type SaleStatus,
} from '~/services/sales.service'
import { getApiMessage } from '~/utils/api-error'

export type { Sale, CreateSale, SaleStatus }

export const useVentas = () => {
  const toast = useToast()
  const items = ref<Sale[]>([])
  const detalle = ref<Sale | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const loadingDetalle = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({
    page: 1,
    limit: 10,
    status: undefined as SaleStatus | undefined,
    from: undefined as string | undefined,
    to: undefined as string | undefined,
  })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listSales({ ...filter })
      items.value = res.items
      total.value = res.total
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener ventas')
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loadingDetalle.value = true
    try {
      detalle.value = await getSale(id)
      return detalle.value
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar la venta'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      loadingDetalle.value = false
    }
  }

  async function create(payload: CreateSale) {
    saving.value = true
    try {
      const r = await createSale(payload)
      toast.add({ title: 'Venta registrada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo registrar la venta'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  async function cancel(id: string) {
    try {
      const r = await cancelSale(id)
      toast.add({ title: 'Venta cancelada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cancelar la venta'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  return { items, detalle, loading, saving, loadingDetalle, error, total, filter, fetchPaginado, fetchById, create, cancel }
}
