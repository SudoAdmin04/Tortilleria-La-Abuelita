import { listUsers, listUsersPaginado, getUser, createUser, updateUser, toggleUserActive, asignarRol, type User, type CreateUser, type UpdateUser } from '~/services/users.service'
import { useAuthStore } from '~/stores/auth.store'

export const useUsuarios = () => {
  const toast = useToast()
  const auth = useAuthStore()

  const items = ref<User[]>([])
  const item = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listUsersPaginado({ pagina: filter.pagina, registros: filter.registros, buscar: filter.buscar })
      items.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener usuarios'
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      items.value = await listUsers()
      total.value = items.value.length
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener usuarios'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    try {
      item.value = await getUser(id)
    } catch (e: any) {
      error.value = e?.data?.message || 'Error al obtener usuario'
    }
  }

  async function create(payload: CreateUser) {
    try {
      const r = await createUser(payload)
      toast.add({ title: 'Usuario creado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al crear usuario', color: 'error' , icon:'i-lucide-triangle-alert'})
      return undefined
    }
  }

  async function update(id: string, payload: UpdateUser) {
    try {
      const r = await updateUser(id, payload)
      toast.add({ title: 'Usuario actualizado', color: 'success', icon: 'i-lucide-circle-check'  })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al actualizar usuario', color: 'error', icon:'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function toggleActivo(id: string) {
    try {
      const r = await toggleUserActive(id)
      toast.add({ title: r.isActive ? 'Usuario activado' : 'Usuario desactivado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo cambiar el estado', color: 'error', icon:'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function assignRole(id: string, roleId: number | null) {
    try {
      await asignarRol(id, roleId)
      toast.add({ title: 'Rol asignado', description: 'Aplica en el próximo login del usuario.', color: 'success' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || e?.message || 'No se pudo asignar el rol', color: 'error', icon:'i-lucide-triangle-alert' })
      throw e
    }
  }

  return { items, item, loading, error, total, filter, fetchPaginado, fetchAll, fetchById, create, update, toggleActivo, assignRole, isAdmin: computed(() => auth.isAdmin) }
}
