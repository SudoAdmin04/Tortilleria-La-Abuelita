import { computed } from 'vue'
import { usePermisosStore } from '~/stores/permisos.store'

export const useMenu = () => {
  const permisosStore = usePermisosStore()

  return {
    mainNavItems: computed(() => permisosStore.mainNavItems),
    configGroups: computed(() => permisosStore.configGroups),
  }
}