import { useApi } from '~/composables/useApi'

export const useSeed = () => {
  const toast = useToast()
  const loading = ref(false)

  async function execute() {
    loading.value = true
    try {
      const res = await useApi().api<any>('/seed')
      toast.add({ title: 'Seed ejecutado', description: 'Datos iniciales cargados.', color: 'success' })
      return res
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo ejecutar el seed', color: 'error' })
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, execute }
}
