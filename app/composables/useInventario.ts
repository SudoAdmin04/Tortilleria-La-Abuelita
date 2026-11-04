import {
  getInventorySummary,
  listInventoryMovements,
  adjustInventory,
  type InventorySummary,
  type InventoryMovement,
  type AdjustInventory,
  type InventoryItemType,
  type InventoryMovementType,
} from '~/services/inventory.service'
import { getApiMessage } from '~/utils/api-error'

export type { InventorySummary, InventoryMovement, AdjustInventory, InventoryItemType, InventoryMovementType }

export const useInventario = () => {
  const toast = useToast()
  const summary = ref<InventorySummary | null>(null)
  const movements = ref<InventoryMovement[]>([])
  const loadingSummary = ref(false)
  const loadingMovements = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const pages = ref(1)
  const filter = reactive({
    page: 1,
    limit: 10,
    itemType: undefined as InventoryItemType | undefined,
    type: undefined as InventoryMovementType | undefined,
    supplyId: undefined as string | undefined,
    productId: undefined as string | undefined,
    from: undefined as string | undefined,
    to: undefined as string | undefined,
  })

  async function fetchSummary() {
    loadingSummary.value = true
    try {
      summary.value = await getInventorySummary()
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener el resumen de inventario')
    } finally {
      loadingSummary.value = false
    }
  }

  async function fetchMovements() {
    loadingMovements.value = true
    error.value = null
    try {
      const res = await listInventoryMovements({ ...filter })
      movements.value = res.items
      total.value = res.total
      pages.value = res.pages
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener el kardex')
    } finally {
      loadingMovements.value = false
    }
  }

  async function adjust(payload: AdjustInventory) {
    saving.value = true
    try {
      const r = await adjustInventory(payload)
      toast.add({ title: 'Ajuste registrado', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchMovements(), fetchSummary()])
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo registrar el ajuste'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  function refreshAll() {
    return Promise.all([fetchMovements(), fetchSummary()])
  }

  return { summary, movements, loadingSummary, loadingMovements, saving, error, total, pages, filter, fetchSummary, fetchMovements, adjust, refreshAll }
}
