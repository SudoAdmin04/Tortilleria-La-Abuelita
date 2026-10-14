
export default defineNuxtRouteMiddleware((to) => {
  if (to.meta.skipPermissionCheck) {
    return
  }
  
  const authStore = useAuthStore()

  if (import.meta.server) {
    const cookieToken = useCookie('auth_token')
    // `auth_flag` es la cookie liviana que sobrevive al límite de 4KB
    // (el JWT con permisos embebidos el navegador lo descarta).
    const flag = useCookie('auth_flag')
    const hasSession = !!cookieToken.value || flag.value === '1'
    if (to.path !== "/login" && !hasSession) {
      return navigateTo("/login")
    }
    if (to.path === "/login" && hasSession) {
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
