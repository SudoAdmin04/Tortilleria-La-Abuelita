import {
  listPurchases,
  createPurchase,
  getPurchase,
  cancelPurchase,
  type Purchase,
  type CreatePurchase,
  type PurchaseStatus,
} from '~/services/purchases.service'
import { getApiMessage } from '~/utils/api-error'

export type { Purchase, CreatePurchase, PurchaseStatus }

export const useCompras = () => {
  const toast = useToast()
  const items = ref<Purchase[]>([])
  const detalle = ref<Purchase | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const loadingDetalle = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({
    page: 1,
    limit: 10,
    supplierId: undefined as string | undefined,
    status: undefined as PurchaseStatus | undefined,
    from: undefined as string | undefined,
    to: undefined as string | undefined,
  })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listPurchases({ ...filter })
      items.value = res.items
      total.value = res.total
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener compras')
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loadingDetalle.value = true
    try {
      detalle.value = await getPurchase(id)
      return detalle.value
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar la compra'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      loadingDetalle.value = false
    }
  }

  async function create(payload: CreatePurchase) {
    saving.value = true
    try {
      const r = await createPurchase(payload)
      toast.add({ title: 'Compra registrada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo registrar la compra'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  async function cancel(id: string) {
    try {
      const r = await cancelPurchase(id)
      toast.add({ title: 'Compra cancelada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cancelar la compra'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  return { items, detalle, loading, saving, loadingDetalle, error, total, filter, fetchPaginado, fetchById, create, cancel }
}
