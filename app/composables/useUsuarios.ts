import { ref } from 'vue'
import { listUsers, asignarRol, type User } from '~/services/users.service'
import { useAuthStore } from '~/stores/auth.store'

export const useUsuarios = () => {
  const toast = useToast()
  const auth = useAuthStore()

  const items = ref<User[]>([])
  const item = ref<User | null>(null)
  const loading = ref(false)
  const total = ref(0)

  const filter = reactive({ buscar: '' as string })

  const filtered = computed(() => {
    const q = filter.buscar.trim().toLowerCase()
    if (!q) return items.value
    return items.value.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  })

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await listUsers()
      total.value = items.value.length
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || e?.message || 'Error al obtener usuarios', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    const found = items.value.find(u => u.id === id)
    if (found) item.value = found
    else {
      if (!items.value.length) await fetchAll()
      item.value = items.value.find(u => u.id === id) ?? null
    }
  }

  async function assignRole(id: string, roleId: number | null) {
    try {
      await asignarRol(id, roleId)
      toast.add({ title: 'Rol asignado', description: 'Aplica en el próximo login del usuario.', color: 'success' })
      await fetchAll()
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || e?.message || 'No se pudo asignar el rol', color: 'error' })
      throw e
    }
  }

  return { items, filtered, item, loading, total, filter, fetchAll, fetchPaginado: fetchAll, fetchById, assignRole, isAdmin: computed(() => auth.isAdmin) }
}
