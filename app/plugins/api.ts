import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import { useAuthStore } from '~/stores/auth.store'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    const baseFetch = $fetch.create({
        baseURL: config.public.apiUrl as string,
        onRequest({ options }) {
            const token = useCookie('auth_token')
            const headers = (options.headers = new Headers(options.headers))

            if (options.body instanceof FormData) {
                if (token.value) {
                    headers.set('Authorization', `Bearer ${token.value}`)
                }
                return
            }

            if (token.value) {
                headers.set('Authorization', `Bearer ${token.value}`)
            }
            if (!options.responseType) {
                headers.set('Accept', 'application/json')
            }
        }
    })

    const apiFetcher = async <T = any>(
        request: NitroFetchRequest,
        options: NitroFetchOptions<NitroFetchRequest> = {}
    ): Promise<T> => {
        try {
            return await (baseFetch as any)(request, options)
        } catch (error: any) {
            if (error.response?.status === 401) {
                const authStore = useAuthStore()
                const refreshed = await authStore.refreshSession()
                if (refreshed) {
                    return await (baseFetch as any)(request, options)
                }else {
                    authStore.logout()
                }
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