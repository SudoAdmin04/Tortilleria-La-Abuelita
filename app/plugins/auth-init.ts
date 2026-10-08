import { useAuthStore } from "~/stores/auth.store"
import { usePermisosStore } from "~/stores/permisos.store"

export default defineNuxtPlugin({
  name: "auth-init",
  setup: () => {
    const authStore = useAuthStore()
    const permisosStore = usePermisosStore()

    if (!authStore.token) {
      authStore.loadFromStorage()
      permisosStore.loadFromStorage()
    }
  },
})
