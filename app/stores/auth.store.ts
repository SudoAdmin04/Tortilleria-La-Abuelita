import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { components } from '~/types/api'
import { usePermisosStore } from './permisos.store'
import { extractPermisosFromToken } from '~/utils/jwt'

export type AuthResponse = components['schemas']['AuthResponseDto']
export type UserSession = components['schemas']['UserResponseDto']
export type LoginDto = components['schemas']['LoginDto']
export type RegistroDto = components['schemas']['RegistroDto']
export type RefreshDto = components['schemas']['RefreshDto']

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const user = ref<UserSession | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => !!user.value?.isAdmin)

  function persist() {
    try {
      if (token.value) {
        localStorage.setItem('auth_token', token.value)
        try { useCookie('auth_token').value = token.value } catch {}
      }
      if (refreshToken.value) localStorage.setItem('auth_refresh_token', refreshToken.value)
      if (user.value) localStorage.setItem('auth_user', JSON.stringify(user.value))
    } catch {}
  }

  function setSession(res: AuthResponse) {
    token.value = res.access_token
    refreshToken.value = res.refresh_token
    user.value = res.usuario
    persist()
    const permisosStore = usePermisosStore()
    const fromToken = extractPermisosFromToken(res.access_token)
    if (fromToken.length) {
      permisosStore.setPantallas(fromToken)
    } else if (Array.isArray((res.usuario as any)?.permisos) && (res.usuario as any).permisos.length) {
      permisosStore.setPantallas((res.usuario as any).permisos)
    }
    return user.value
  }

  function loadFromStorage() {
    try {
      const t = localStorage.getItem('auth_token')
      if (t) {
        token.value = t
        try { useCookie('auth_token').value = t } catch {}
      } else {
        try {
          const ct = useCookie('auth_token').value as unknown as string | null
          if (ct) token.value = ct
        } catch {}
      }
      const rt = localStorage.getItem('auth_refresh_token')
      if (rt) refreshToken.value = rt
      const u = localStorage.getItem('auth_user')
      if (u) user.value = JSON.parse(u)
      try {
        const permisosStore = usePermisosStore()
        if (token.value && !permisosStore.pantallas.length) {
          permisosStore.loadFromToken(token.value)
        }
      } catch {}
    } catch {}
  }

  function initAuth() {
    const permisosStore = usePermisosStore()
    try {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        loadFromStorage()
        permisosStore.loadFromStorage()
        if (permisosStore.pantallas.length === 0) {
          const fromUser = (user.value as any)?.permisos
          if (Array.isArray(fromUser) && fromUser.length) {
            permisosStore.setPantallas(fromUser)
          } else {
            permisosStore.loadFromToken(token.value)
          }
        }
      }
    } catch {
      logout()
    }
  }

  async function login(credentials: LoginDto) {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const res = await ($api as typeof $fetch)<AuthResponse>('/auth/login', {
        method: 'POST',
        body: credentials,
      })
      if (!res?.access_token || !res?.usuario) throw new Error('Respuesta del servidor no válida')
      setSession(res)
      return { data: res, error: null as string | null }
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || 'Error al autenticar'
      return { data: null, error: Array.isArray(msg) ? msg.join(', ') : String(msg) }
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegistroDto) {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const res = await ($api as typeof $fetch)<AuthResponse>('/auth/registro', {
        method: 'POST',
        body: payload,
      })
      if (!res?.access_token || !res?.usuario) throw new Error('Respuesta del servidor no válida')
      setSession(res)
      return { data: res, error: null as string | null }
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || 'No se pudo crear la cuenta'
      return { data: null, error: Array.isArray(msg) ? msg.join(', ') : String(msg) }
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    try {
      const { $api } = useNuxtApp()
      const profile = await ($api as typeof $fetch)<UserSession>('/auth/profile')
      user.value = profile
      try { localStorage.setItem('auth_user', JSON.stringify(profile)) } catch {}
      const permisosStore = usePermisosStore()
      if (Array.isArray((profile as any)?.permisos) && (profile as any).permisos.length) {
        permisosStore.setPantallas((profile as any).permisos)
      } else if (token.value) {
        permisosStore.loadFromToken(token.value)
      }
      return profile
    } catch {
      return null
    }
  }

  async function refreshSession(): Promise<boolean> {
    const currentRefreshToken = refreshToken.value || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_refresh_token') : null)
    if (!currentRefreshToken) return false
    try {
      const config = useRuntimeConfig()
      const res = await $fetch<AuthResponse>(`${config.public.apiUrl}/auth/refresh`, {
        method: 'POST',
        body: { refresh_token: currentRefreshToken } satisfies RefreshDto,
      })
      setSession(res)
      return true
    } catch {
      logout()
      return false
    }
  }

  function logout() {
    const permisosStore = usePermisosStore()
    token.value = null
    refreshToken.value = null
    user.value = null
    try {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_refresh_token')
      localStorage.removeItem('auth_user')
      useCookie('auth_token').value = null
    } catch {}
    permisosStore.reset()
    navigateTo('/login')
  }

  return {
    token,
    refreshToken,
    user,
    loading,
    isAdmin,
    isAuthenticated,
    login,
    register,
    fetchProfile,
    refreshSession,
    loadFromStorage,
    initAuth,
    logout,
  }
})
