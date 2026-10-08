import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type LoginPayload = components['schemas']['LoginDto']
export type RegistroPayload = components['schemas']['RegistroDto']
export type AuthResponse = components['schemas']['AuthResponseDto']
export type UserProfile = components['schemas']['UserResponseDto']

/** POST /auth/login — baseURL ya incluye /api. */
export function login(payload: LoginPayload) {
  return useApi().api<AuthResponse>('/auth/login', { method: 'POST', body: payload })
}

/** POST /auth/registro — crea usuario + siembra catálogo, devuelve JWT. */
export function register(payload: RegistroPayload) {
  return useApi().api<AuthResponse>('/auth/registro', { method: 'POST', body: payload })
}

/** POST /auth/refresh */
export function refresh(refresh_token: string) {
  return useApi().api<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: { refresh_token } satisfies components['schemas']['RefreshDto'],
  })
}

/** GET /auth/profile — requiere JWT. */
export function me() {
  return useApi().api<UserProfile>('/auth/profile')
}
