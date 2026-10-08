import { listRolesPaginado, listRoles, createRole, updateRole, deleteRole, type Role, type CreateRole, type UpdateRole } from '~/services/roles.service'

export const useRoles = () => {
  const toast = useToast()
  const items = ref<Role[]>([])
  const item = ref<Role | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listRolesPaginado({ pagina: filter.pagina, registros: filter.registros, buscar: filter.buscar })
      items.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener roles'
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await listRoles()
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener roles'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: number | string) {
    try {
      const { getRole } = await import('~/services/roles.service')
      item.value = await getRole(id)
    } catch (e: any) {
      error.value = e?.data?.message || 'Error al obtener rol'
    }
  }

  async function create(payload: CreateRole) {
    try {
      const r = await createRole(payload)
      toast.add({ title: 'Rol creado', color: 'success' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al crear rol', color: 'error' })
      return undefined
    }
  }

  async function update(id: number | string, payload: UpdateRole) {
    try {
      const r = await updateRole(id, payload)
      toast.add({ title: 'Rol actualizado', color: 'success' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: 'Error al actualizar rol', color: 'error' })
      return undefined
    }
  }

  async function remove(id: number | string) {
    try {
      await deleteRole(id)
      toast.add({ title: 'Rol eliminado', color: 'success' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar', color: 'error' })
    }
  }

  return { items, item, loading, error, total, filter, fetchPaginado, fetchAll, fetchById, create, update, remove }
}

