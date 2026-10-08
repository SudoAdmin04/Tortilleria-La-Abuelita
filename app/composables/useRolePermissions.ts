import { listRoleScreensPaginado, listRoleScreens, createRoleScreen, updateRoleScreen, deleteRoleScreen, type RoleScreen, type CreateRoleScreen, type UpdateRoleScreen } from '~/services/role-screens.service'

export const useRolePermissions = () => {
  const toast = useToast()
  const items = ref<RoleScreen[]>([])
  const item = ref<RoleScreen | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listRoleScreensPaginado({ pagina: filter.pagina, registros: filter.registros, buscar: filter.buscar })
      items.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener permisos'
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      items.value = await listRoleScreens()
      total.value = items.value.length
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener permisos'
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateRoleScreen) {
    try {
      const r = await createRoleScreen(payload)
      toast.add({ title: 'Permiso asignado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al asignar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: number | string, payload: UpdateRoleScreen) {
    try {
      const r = await updateRoleScreen(id, payload)
      toast.add({ title: 'Permiso actualizado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al actualizar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: number | string) {
    try {
      await deleteRoleScreen(id)
      toast.add({ title: 'Permiso eliminado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo eliminar', color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, item, loading, error, total, filter, filters: filter, fetchPaginado, fetchAll, create, update, remove }
}
