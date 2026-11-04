import {
  listProducts,
  listProductsPaginado,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  getProduct,
  getProductRecipe,
  setProductRecipe,
  type Product,
  type CreateProduct,
  type UpdateProduct,
  type ProductRecipe,
  type RecipeItem,
} from '~/services/products.service'
import { getApiMessage } from '~/utils/api-error'

export type { Product, CreateProduct, UpdateProduct, ProductRecipe, RecipeItem }

export const useProductos = () => {
  const toast = useToast()
  const items = ref<Product[]>([])
  const item = ref<Product | null>(null)
  const receta = ref<ProductRecipe[]>([])
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
      const res = await listProductsPaginado({
        pagina: filter.pagina,
        registros: filter.registros,
        buscar: filter.buscar,
        isActive: filter.isActive,
        lowStock: filter.lowStock,
      })
      items.value = res.data
      total.value = res.total
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener productos')
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    try {
      return await listProducts()
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener productos')
      return [] as Product[]
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getProduct(id)
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'Error al obtener producto')
    }
  }

  async function fetchRecipe(id: string) {
    try {
      receta.value = await getProductRecipe(id)
      return receta.value
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar la receta'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return [] as ProductRecipe[]
    }
  }

  async function saveRecipe(id: string, items: RecipeItem[]) {
    saving.value = true
    try {
      const r = await setProductRecipe(id, { items })
      toast.add({ title: 'Receta actualizada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo guardar la receta'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  async function create(payload: CreateProduct) {
    saving.value = true
    try {
      const r = await createProduct(payload)
      toast.add({ title: 'Producto creado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al crear producto'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  async function update(id: string, payload: UpdateProduct) {
    saving.value = true
    try {
      const r = await updateProduct(id, payload)
      toast.add({ title: 'Producto actualizado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Error al actualizar producto'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    } finally {
      saving.value = false
    }
  }

  async function toggleActivo(id: string) {
    try {
      const r = await toggleProductActive(id)
      toast.add({ title: r.isActive ? 'Producto activado' : 'Producto desactivado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cambiar el estado'), color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: string) {
    try {
      await deleteProduct(id)
      toast.add({ title: 'Producto eliminado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: unknown) {
      toast.add({ title: 'Error', description: getApiMessage(e, 'Si tiene movimientos o ventas, desactívalo'), color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, item, receta, loading, saving, error, total, filter, fetchPaginado, fetchAll, fetchById, fetchRecipe, saveRecipe, create, update, toggleActivo, remove }
}
