/** Decodifica el payload de un JWT sin verificar firma (solo lectura cliente). */
export function decodeJwtPayload<T = Record<string, any>>(token: string | null | undefined): T | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('utf-8')
    // atob rompe con UTF-8; reconvierte bytes -> string
    const text = typeof atob === 'function'
      ? decodeURIComponent(Array.from(json).map(c => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''))
      : json
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export interface PermisoToken {
  screenId: number
  screen: string
  parentId?: number | null
  path: string | null
  icon: string | null
  module?: string | null
  submodule?: string | null
  subModule?: string | null
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

/** Extrae `permisos` del JWT (fuente de verdad según backend: viajan en el token, no en `usuario`). */
export function extractPermisosFromToken(token: string | null | undefined): PermisoToken[] {
  const payload = decodeJwtPayload<{ permisos?: unknown }>(token)
  const list = payload?.permisos
  return Array.isArray(list) ? (list as PermisoToken[]) : []
}

/** Expiración (`exp`, segundos epoch) del JWT, o `null` si no se puede leer. */
export function getTokenExpiry(token: string | null | undefined): number | null {
  const payload = decodeJwtPayload<{ exp?: unknown }>(token)
  return typeof payload?.exp === 'number' ? payload.exp : null
}

/** `true` si el token está ausente, ilegible o expirado (con margen de `leewaySec`). */
export function isTokenExpired(token: string | null | undefined, leewaySec = 30): boolean {
  const exp = getTokenExpiry(token)
  if (exp == null) return true
  return exp * 1000 <= Date.now() + leewaySec * 1000
}
