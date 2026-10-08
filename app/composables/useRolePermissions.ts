import { listRoleScreensPaginado, createRoleScreen, updateRoleScreen, deleteRoleScreen, type RoleScreen, type CreateRoleScreen, type UpdateRoleScreen } from '~/services/role-screens.service'

export const useRolePermissions = () => {
  const toast = useToast()
  const items = ref<RoleScreen[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filters = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined })

  async function fetchPaginado() {
    loading.value = true
    try {
      const res = await listRoleScreensPaginado({ pagina: filters.pagina, registros: filters.registros, buscar: filters.buscar })
      items.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.data?.message || 'Error al obtener permisos'
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateRoleScreen) {
    try {
      const r = await createRoleScreen(payload)
      toast.add({ title: 'Permiso asignado', color: 'success' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al asignar', color: 'error' })
      return undefined
    }
  }

  async function update(id: number, payload: UpdateRoleScreen) {
    try {
      const r = await updateRoleScreen(id, payload)
      toast.add({ title: 'Permiso actualizado', color: 'success' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: 'Error al actualizar', color: 'error' })
      return undefined
    }
  }

  async function remove(id: number) {
    try {
      await deleteRoleScreen(id)
      toast.add({ title: 'Permiso eliminado', color: 'success' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar', color: 'error' })
    }
  }

  return { items, loading, error, total, filters, fetchPaginado, create, update, remove }
}

