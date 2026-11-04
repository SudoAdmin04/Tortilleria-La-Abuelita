import {
  listSuppliers,
  listSuppliersPaginado,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierActive,
  getSupplier,
  type Supplier,
  type CreateSupplier,
  type UpdateSupplier,
} from '~/services/suppliers.service'
import { getApiMessage } from '~/utils/api-error'

export type { Supplier, CreateSupplier, UpdateSupplier }

export const useProveedores = () => {
  const toast = useToast()
  const items = ref<Supplier[]>([])
  const item = ref<Supplier | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({
    pagina: 1,
    registros: 10,
    buscar: undefined as string | undefined,
    isActive: undefined as boolean | undefined,
  })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listSuppliersPaginado({
        pagina: filter.pagina,
        registros: filter.registros,
        buscar: filter.buscar,
        isActive: filter.isActive,
      })
      items.value = res.data
      total.value = res.total
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener proveedores')
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    try {
      return await listSuppliers()
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener proveedores')
      return [] as Supplier[]
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getSupplier(id)
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener proveedor')
    }
  }

  async function create(payload: CreateSupplier) {
    saving.value = true
    try {
      const r = await createSupplier(payload)
      toast.add({ title: 'Proveedor creado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al crear proveedor'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  async function update(id: string, payload: UpdateSupplier) {
    saving.value = true
    try {
      const r = await updateSupplier(id, payload)
      toast.add({ title: 'Proveedor actualizado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al actualizar proveedor'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  async function toggleActivo(id: string) {
    try {
      const r = await toggleSupplierActive(id)
      toast.add({ title: r.isActive ? 'Proveedor activado' : 'Proveedor desactivado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cambiar el estado'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: string) {
    try {
      await deleteSupplier(id)
      toast.add({ title: 'Proveedor eliminado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Si tiene compras registradas, desactívalo'), color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, item, loading, saving, error, total, filter, fetchPaginado, fetchAll, fetchById, create, update, toggleActivo, remove }
}
