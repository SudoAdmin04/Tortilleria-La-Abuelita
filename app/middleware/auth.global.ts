
export default defineNuxtRouteMiddleware((to) => {
  if (to.meta.skipPermissionCheck) {
    return
  }
  
  const authStore = useAuthStore()

  if (import.meta.server) {
    const cookieToken = useCookie('auth_token')
    if (to.path !== "/login" && !cookieToken.value) {
      return navigateTo("/login")
    }
    if (to.path === "/login" && cookieToken.value) {
      return navigateTo("/")
    }
    return
  }

  if (!authStore.token) {
    authStore.loadFromStorage()
    const permisosStore = usePermisosStore()
    permisosStore.loadFromStorage()
  }

  if (to.path !== "/login" && !authStore.token) {
    return navigateTo("/login")
  }

  if (to.path === "/login" && authStore.token) {
    return navigateTo("/")
  }

  if (to.path !== "/" && to.path !== "/login") {
    const permisosStore = usePermisosStore()
    if (permisosStore.pantallas.length > 0 && !permisosStore.can(to.path)) {
      throw createError({ statusCode: 404, statusMessage: "Página no encontrada" })
    }
  }
})
