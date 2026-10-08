import { computed } from 'vue'
import { usePermisosStore } from '~/stores/permisos.store'

export const usePermissions = () => {
  const permisosStore = usePermisosStore()

  if (import.meta.client && !permisosStore.pantallas.length) {
    permisosStore.loadFromStorage()
  }

  const can = (ruta: string, accion: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete' = 'canRead') =>
    permisosStore.can(ruta, accion)

  const hasScreen = (ruta: string) => !!permisosStore.findByPath(ruta)

  const refreshFromToken = () => permisosStore.loadFromToken()

  return {
    can,
    hasScreen,
    refreshFromToken,
    pantallas: computed(() => permisosStore.pantallas),
  }
}

export const usePermisos = usePermissions