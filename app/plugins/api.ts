import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import { useAuthStore, AUTH_COOKIE_OPTS } from '~/stores/auth.store'
import { isTokenExpired } from '~/utils/jwt'

type RetryableOptions = NitroFetchOptions<NitroFetchRequest> & { _retried?: boolean }

/**
 * Fuente de verdad del access token para el header Authorization.
 * El JWT incluye `permisos` (~4.8KB) y supera el límite de cookies (~4KB):
 * el navegador descarta `auth_token`, así que la cookie NO es confiable.
 * Orden: Pinia (memoria) -> localStorage -> cookie (solo SSR / fallback).
 */
function resolveAccessToken(): string | null {
  try {
    const t = useAuthStore().token as unknown as string | null
    if (t) return t
  } catch {}
  try {
    if (typeof localStorage !== 'undefined') {
      const t = localStorage.getItem('auth_token')
      if (t) return t
    }
  } catch {}
  try {
    const ct = useCookie('auth_token', AUTH_COOKIE_OPTS).value as unknown as string | null
    if (ct) return ct
  } catch {}
  return null
}

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    const baseFetch = $fetch.create({
        baseURL: config.public.apiUrl as string,
        onRequest({ options }) {
            const token = resolveAccessToken()
            const headers = (options.headers = new Headers(options.headers))

            if (token) {
                headers.set('Authorization', `Bearer ${token}`)
            }
            if (!options.responseType && !(options.body instanceof FormData)) {
                headers.set('Accept', 'application/json')
            }
        }
    })

    const apiFetcher = async <T = any>(
        request: NitroFetchRequest,
        options: RetryableOptions = {}
    ): Promise<T> => {
        const authStore = useAuthStore()

        // 1) Si el access ya expiró, refresca ANTES de disparar (single-flight en el store).
        //    Evita que N peticiones paralelas (dashboard, notificaciones) choquen con 401.
        if (!options._retried) {
            const current = resolveAccessToken()
            if (current && isTokenExpired(current)) {
                await authStore.refreshSession()
            }
        }

        try {
            return await (baseFetch as any)(request, options)
        } catch (error: any) {
            // 2) Un solo reintento por petición: si el refresh falla o el retry vuelve a dar
            //    401, se cierra sesión una sola vez (sin cascadas entre peticiones paralelas).
            if (error.response?.status === 401 && !options._retried) {
                options._retried = true
                const refreshed = await authStore.refreshSession()
                if (refreshed) {
                    return await (baseFetch as any)(request, options)
                }
                authStore.logout()
            }
            throw error
        }
    }

    return {
        provide: {
            api: apiFetcher
        }
    }
})
