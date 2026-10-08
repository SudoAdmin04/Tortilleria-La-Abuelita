import { ref } from 'vue'
import { listNotificationsPaginado, updateNotification, deleteNotification, type Notification } from '~/services/notifications.service'

export const useNotificaciones = () => {
  const toast = useToast()
  const notificaciones = ref<Notification[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sinLeer = computed(() => notificaciones.value.filter(n => !n.isRead).length)

  const filters = ref({ pagina: 1, registros: 10, buscar: '' })

  async function fetchNotificaciones() {
    loading.value = true
    error.value = null
    try {
      const res = await listNotificationsPaginado({ pagina: filters.value.pagina, registros: filters.value.registros, buscar: filters.value.buscar || undefined })
      notificaciones.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al cargar notificaciones'
    } finally {
      loading.value = false
    }
  }

  async function marcarLeida(id: string) {
    try {
      await updateNotification(id, { isRead: true })
      const n = notificaciones.value.find(x => x.id === id)
      if (n) n.isRead = true
    } catch (e: any) {
      toast.add({ title: 'Error', description: 'No se pudo marcar como leída', color: 'error' })
    }
  }

  async function eliminar(id: string) {
    try {
      await deleteNotification(id)
      notificaciones.value = notificaciones.value.filter(x => x.id !== id)
    } catch (e: any) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar', color: 'error' })
    }
  }

  return { notificaciones, items: notificaciones, total, loading, error, sinLeer, filters, fetchNotificaciones, fetchNuevas: fetchNotificaciones, marcarLeida, eliminar }
}
