import { listScreensPaginado, listScreens, createScreen, updateScreen, deleteScreen, toggleScreen, type Screen, type CreateScreen, type UpdateScreen } from '~/services/screens.service'

export type { Screen, CreateScreen, UpdateScreen }

export const usePantallas = () => {
  const toast = useToast()
  const items = ref<Screen[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listScreensPaginado({ pagina: filters.pagina, registros: filters.registros, buscar: filters.buscar })
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
    try {
      items.value = await listScreens()
      total.value = items.value.length
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener pantallas'
    } finally {
      loading.value = false
    }
  }

  async function create(data: CreateScreen) {
    try {
      const c = await createScreen(data)
      toast.add({ title: 'Pantalla creada', color: 'success' })
      await fetchPaginado()
      return c
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al crear pantalla', color: 'error' })
      return undefined
    }
  }

  async function update(id: number, data: UpdateScreen) {
    try {
      const u = await updateScreen(id, data)
      toast.add({ title: 'Pantalla actualizada', color: 'success' })
      await fetchPaginado()
      return u
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al actualizar', color: 'error' })
      return undefined
    }
  }

  async function toggleActivo(id: number, activo: boolean) {
    try {
      await toggleScreen(id, activo)
      toast.add({ title: activo ? 'Pantalla activada' : 'Pantalla desactivada', color: 'success' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: 'No se pudo cambiar el estado', color: 'error' })
    }
  }

  async function remove(id: number) {
    try {
      await deleteScreen(id)
      toast.add({ title: 'Pantalla eliminada', color: 'success' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo eliminar', color: 'error' })
    }
  }

  return { items, loading, error, total, filters, fetchAll, create, update, toggleActivo, remove, fetchPaginado }
}

