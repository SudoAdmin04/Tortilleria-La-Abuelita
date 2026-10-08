import { listRolesPaginado, listRoles, createRole, updateRole, deleteRole, toggleRoleActive, type Role, type CreateRole, type UpdateRole } from '~/services/roles.service'

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
    error.value = null
    try {
      items.value = await listRoles()
      total.value = items.value.length
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
      toast.add({ title: 'Rol creado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al crear rol', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: number | string, payload: UpdateRole) {
    try {
      const r = await updateRole(id, payload)
      toast.add({ title: 'Rol actualizado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al actualizar rol', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: number | string) {
    try {
      await deleteRole(id)
      toast.add({ title: 'Rol eliminado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo eliminar', color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  async function toggleActivo(id: number | string) {
    try {
      const r = await toggleRoleActive(id)
      toast.add({ title: r.isActive ? 'Rol activado' : 'Rol desactivado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo cambiar el estado', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  return { items, item, loading, error, total, filter, fetchPaginado, fetchAll, fetchById, create, update, toggleActivo, remove }
}
