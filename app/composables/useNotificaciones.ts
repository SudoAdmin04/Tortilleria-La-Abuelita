import { listNotificationsPaginado, listNotifications, createNotification, updateNotification, deleteNotification, type Notification, type CreateNotification } from '~/services/notifications.service'

export const useNotificaciones = () => {
  const toast = useToast()
  const notificaciones = ref<Notification[]>([])
  const item = ref<Notification | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sinLeer = computed(() => notificaciones.value.filter(n => !n.isRead).length)

  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined })

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listNotificationsPaginado({ pagina: filter.pagina, registros: filter.registros, buscar: filter.buscar })
      notificaciones.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al cargar notificaciones'
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      notificaciones.value = await listNotifications()
      total.value = notificaciones.value.length
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al cargar notificaciones'
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateNotification) {
    try {
      const r = await createNotification(payload)
      toast.add({ title: 'Notificación creada', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al crear', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function marcarLeida(id: string) {
    try {
      const r = await updateNotification(id, { isRead: true })
      const n = notificaciones.value.find(x => x.id === id)
      if (n) n.isRead = true
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo marcar como leída', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function toggleLeida(id: string, isRead: boolean) {
    try {
      const r = await updateNotification(id, { isRead })
      const n = notificaciones.value.find(x => x.id === id)
      if (n) n.isRead = isRead
      toast.add({ title: isRead ? 'Marcada como leída' : 'Marcada como no leída', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo actualizar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function eliminar(id: string) {
    try {
      await deleteNotification(id)
      toast.add({ title: 'Notificación eliminada', color: 'success', icon: 'i-lucide-circle-check' })
      notificaciones.value = notificaciones.value.filter(x => x.id !== id)
      total.value = Math.max(0, total.value - 1)
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo eliminar', color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return {
    notificaciones,
    items: notificaciones,
    item,
    total,
    loading,
    error,
    sinLeer,
    filter,
    filters: filter,
    fetchPaginado,
    fetchNotificaciones: fetchPaginado,
    fetchNuevas: fetchPaginado,
    fetchAll,
    create,
    marcarLeida,
    toggleLeida,
    eliminar,
  }
}
