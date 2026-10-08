import { listCategories, listCategoriesPaginado, createCategory, updateCategory, deleteCategory, toggleCategoryActive, getCategory, type Category, type CategoryTree, type CreateCategory, type UpdateCategory } from '~/services/categories.service'

export type CategoriaRow = Category & { displayName: string; isRubro: boolean }

function toRow(c: Category): CategoriaRow {
  const isRubro = !c.parentId
  return { ...c, displayName: isRubro ? c.name : `— ${c.name}`, isRubro }
}

function flattenTree(res: Category[] | CategoryTree[]): CategoriaRow[] {
  const flat: CategoriaRow[] = []
  for (const r of res as any[]) {
    if (r?.children !== undefined) {
      flat.push({ ...(r as Category), displayName: r.name, isRubro: true })
      for (const c of (r.children || [])) {
        flat.push({ ...(c as Category), displayName: `— ${c.name}`, isRubro: false })
      }
    } else {
      flat.push(toRow(r as Category))
    }
  }
  return flat
}

export const useCategorias = () => {
  const toast = useToast()
  const items = ref<CategoriaRow[]>([])
  const rubros = ref<Category[]>([])
  const item = ref<Category | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined })

  /** Paginado en servidor: GET /categories/paginado (lista plana). */
  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listCategoriesPaginado({ pagina: filter.pagina, registros: filter.registros, buscar: filter.buscar })
      items.value = res.data.map(toRow)
      total.value = res.total
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener categorías'
    } finally {
      loading.value = false
    }
  }

  /** Árbol completo para el selector de rubro padre del Drawer (no paginado). */
  async function fetchTree() {
    try {
      const res = await listCategories(true)
      const all = flattenTree(res)
      rubros.value = all.filter(r => r.isRubro)
      return rubros.value
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener rubros'
      return []
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getCategory(id)
    } catch (e: any) {
      error.value = e?.data?.message || 'Error al obtener categoría'
    }
  }

  async function create(payload: CreateCategory) {
    try {
      const r = await createCategory(payload)
      toast.add({ title: 'Categoría creada', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchPaginado(), fetchTree()])
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al crear categoría', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: string, payload: UpdateCategory) {
    try {
      const r = await updateCategory(id, payload)
      toast.add({ title: 'Categoría actualizada', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchPaginado(), fetchTree()])
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al actualizar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  /** PATCH /categories/:id/toggle-active — sin body, el backend invierte el estado. */
  async function toggleActivo(id: string) {
    try {
      const r = await toggleCategoryActive(id)
      toast.add({ title: r.isActive ? 'Categoría activada' : 'Categoría desactivada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo cambiar el estado', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: string) {
    try {
      await deleteCategory(id)
      toast.add({ title: 'Categoría eliminada', color: 'success', icon: 'i-lucide-circle-check' })
      await Promise.all([fetchPaginado(), fetchTree()])
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Si está en uso, desactívala', color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, rubros, item, loading, error, total, filter, fetchPaginado, fetchTree, fetchById, create, update, toggleActivo, remove }
}
