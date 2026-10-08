import { listCategories, createCategory, updateCategory, deleteCategory, getCategory, type Category, type CategoryTree, type CreateCategory, type UpdateCategory } from '~/services/categories.service'

export type CategoriaRow = Category & { displayName: string; isRubro: boolean }

export const useCategorias = () => {
  const toast = useToast()
  const items = ref<CategoriaRow[]>([])
  const rubros = ref<Category[]>([])
  const item = ref<Category | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined, tree: true })

  function flatten(res: Category[] | CategoryTree[]): CategoriaRow[] {
    const flat: CategoriaRow[] = []
    for (const r of res as any[]) {
      if (r?.children !== undefined) {
        flat.push({ ...(r as Category), displayName: r.name, isRubro: true })
        for (const c of (r.children || [])) {
          flat.push({ ...(c as Category), displayName: `— ${c.name}`, isRubro: false })
        }
      } else {
        const isRubro = !(r as Category).parentId
        flat.push({ ...(r as Category), displayName: isRubro ? r.name : `— ${r.name}`, isRubro })
      }
    }
    return flat
  }

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listCategories(filter.tree)
      const all = flatten(res)
      rubros.value = all.filter(r => r.isRubro)
      const q = filter.buscar?.trim().toLowerCase()
      const filtrados = q ? all.filter(r => r.name.toLowerCase().includes(q) || r.kind.toLowerCase().includes(q)) : all
      total.value = filtrados.length
      const start = (filter.pagina - 1) * filter.registros
      items.value = filtrados.slice(start, start + filter.registros)
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener categorías'
    } finally {
      loading.value = false
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
      await fetchPaginado()
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
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al actualizar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function toggleActivo(id: string, current: boolean) {
    try {
      const r = await updateCategory(id, { isActive: !current, sortOrder: 0 })
      toast.add({ title: !current ? 'Categoría activada' : 'Categoría desactivada', color: 'success', icon: 'i-lucide-circle-check' })
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
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Si está en uso, desactívala', color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, rubros, item, loading, error, total, filter, fetchPaginado, fetchById, create, update, toggleActivo, remove }
}
