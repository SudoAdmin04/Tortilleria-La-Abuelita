import { listScreensPaginado, listScreens, createScreen, updateScreen, deleteScreen, toggleScreen, type Screen, type CreateScreen, type UpdateScreen } from '~/services/screens.service'

export type { Screen, CreateScreen, UpdateScreen }

export const usePantallas = () => {
  const toast = useToast()
  const items = ref<Screen[]>([])
  const item = ref<Screen | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listScreensPaginado({ pagina: filter.pagina, registros: filter.registros, buscar: filter.buscar })
      items.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener pantallas'
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      items.value = await listScreens()
      total.value = items.value.length
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener pantallas'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: number | string) {
    try {
      const { getScreen } = await import('~/services/screens.service')
      item.value = await getScreen(id)
    } catch (e: any) {
      error.value = e?.data?.message || 'Error al obtener pantalla'
    }
  }

  async function create(data: CreateScreen) {
    try {
      const c = await createScreen(data)
      toast.add({ title: 'Pantalla creada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return c
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al crear pantalla', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: number | string, data: UpdateScreen) {
    try {
      const u = await updateScreen(id, data)
      toast.add({ title: 'Pantalla actualizada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return u
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al actualizar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function toggleActivo(id: number | string) {
    try {
      const r = await toggleScreen(id)
      toast.add({ title: r.isActive ? 'Pantalla activada' : 'Pantalla desactivada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo cambiar el estado', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: number | string) {
    try {
      await deleteScreen(id)
      toast.add({ title: 'Pantalla eliminada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo eliminar', color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, item, loading, error, total, filter, filters: filter, fetchPaginado, fetchAll, fetchById, create, update, toggleActivo, remove }
}
