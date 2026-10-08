import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NavigationMenuItem } from '#ui/types'
import { extractPermisosFromToken } from '~/utils/jwt'

export interface PermisoPantalla {
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

export type PantallaBackend = PermisoPantalla
export type AccionPermiso = 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete'

const FALLBACK_ICON = 'i-lucide-layout-dashboard'
const CONFIG_ROOT = '/configuracion'
const SYNTHETIC_CONFIG_ID = -1

const MAIN_ORDER = ['/dashboard', '/transacciones', '/presupuestos', '/analiticas', '/cuentas', '/configuracion']
const MODULE_ORDER = ['finanzas', 'administracion', 'seguridad', 'sistema', 'configuracion', 'general']

const MODULE_LABELS: Record<string, string> = {
  finanzas: 'Finanzas',
  administracion: 'Administración',
  administración: 'Administración',
  admin: 'Administración',
  seguridad: 'Seguridad',
  sistema: 'Sistema',
  configuracion: 'Configuración',
  configuración: 'Configuración',
  general: 'General',
}

function normalizePath(p: string | null | undefined): string {
  const s = (p ?? '').trim()
  return s.length > 1 && s.endsWith('/') ? s.slice(0, -1) : s
}

function normalizeIcon(icon: string | null | undefined): string {
  const s = (icon ?? '').trim()
  if (!s) return FALLBACK_ICON
  return s.startsWith('i-') ? s : `i-lucide-${s}`
}

function normalizeModule(raw: string | null | undefined, path = ''): string {
  const s = (raw ?? '').trim().toLowerCase()
  if (s) return s
  const [, , second] = path.split('/')
  return (second ?? 'general').toLowerCase() || 'general'
}

function moduleLabel(key: string): string {
  return MODULE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

function isConfigPath(to: string): boolean {
  return to === CONFIG_ROOT || to.startsWith(`${CONFIG_ROOT}/`)
}

// Convertidor recursivo a formato NavigationMenuItem de Nuxt UI
function toNavigationItem(item: any): NavigationMenuItem {
  return {
    label: item.label,
    icon: item.icon,
    to: item.to,
    children: item.children?.map(toNavigationItem),
  }
}

export const usePermisosStore = defineStore('permisos', () => {
  const pantallas = ref<PantallaBackend[]>([])

  const legibles = computed(() =>
    pantallas.value.filter(p => p?.canRead && normalizePath(p.path)),
  )

  const ids = computed(() => new Set(legibles.value.map(p => p.screenId)))

  // Menú Principal
  const mainParents = computed(() => {
    const parents = legibles.value
      .filter((p) => {
        const to = normalizePath(p.path)
        return to === CONFIG_ROOT || !isConfigPath(to)
      })
      .filter(p => p.parentId == null || !ids.value.has(p.parentId))
      .map(p => ({
        id: p.screenId,
        label: p.screen ?? '',
        icon: normalizeIcon(p.icon),
        to: normalizePath(p.path),
        module: normalizeModule(p.module, normalizePath(p.path)),
        parentId: typeof p.parentId === 'number' ? p.parentId : null,
      }))

    const hasConfigEntry = parents.some(i => i.to === CONFIG_ROOT)
    const hasConfigChildren = legibles.value.some((p) => {
      const to = normalizePath(p.path)
      return to !== CONFIG_ROOT && isConfigPath(to)
    })

    if (!hasConfigEntry && hasConfigChildren) {
      parents.push({
        id: SYNTHETIC_CONFIG_ID,
        label: 'Configuración',
        icon: 'i-lucide-settings',
        to: CONFIG_ROOT,
        module: 'configuracion',
        parentId: null,
      })
    }

    return parents.sort((a, b) => {
      const rank = (to: string) => {
        const i = MAIN_ORDER.indexOf(to)
        return i === -1 ? 99 : i
      }
      return rank(a.to) - rank(b.to) || a.label.localeCompare(b.label)
    })
  })

  // Exportar directo como NavigationMenuItem[] para Nuxt UI
  const mainNavItems = computed<NavigationMenuItem[]>(() =>
    mainParents.value.map(toNavigationItem)
  )

  // Submenú de Configuración agrupado por módulos
  const configGroups = computed(() => {
    const hijas = legibles.value
      .filter(p => isConfigPath(normalizePath(p.path)) && normalizePath(p.path) !== CONFIG_ROOT)
      .map(p => ({
        id: p.screenId,
        label: p.screen ?? '',
        icon: normalizeIcon(p.icon),
        to: normalizePath(p.path),
        module: normalizeModule(p.module, normalizePath(p.path)),
        parentId: typeof p.parentId === 'number' ? p.parentId : null,
        children: [] as any[],
      }))

    const byId = new Map(hijas.map(i => [i.id, i]))
    const roots: any[] = []

    for (const item of hijas) {
      const parent = item.parentId != null ? byId.get(item.parentId) : undefined
      if (parent && parent.id !== item.id) {
        parent.children.push(item)
      } else {
        roots.push(item)
      }
    }

    const byModule = new Map<string, any[]>()
    for (const item of roots) {
      const key = (item.module ?? 'general').toLowerCase()
      if (!byModule.has(key)) byModule.set(key, [])
      byModule.get(key)!.push(item)
    }

    return [...byModule.entries()]
      .map(([module, items]) => ({
        module,
        label: moduleLabel(module),
        items: items.map(toNavigationItem),
      }))
      .sort((a, b) => {
        const ia = MODULE_ORDER.indexOf(a.module)
        const ib = MODULE_ORDER.indexOf(b.module)
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.label.localeCompare(b.label)
      })
  })

  function setPantallas(data: PantallaBackend[]) {
    pantallas.value = Array.isArray(data) ? data : []
    try {
      localStorage.setItem('auth_screens', JSON.stringify(pantallas.value))
    } catch {}
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem('auth_screens')
      const parsed = stored ? JSON.parse(stored) : null
      if (Array.isArray(parsed) && parsed.length) {
        pantallas.value = parsed
        return
      }
    } catch {}
    loadFromToken()
  }

  function loadFromToken(providedToken?: string | null): boolean {
    try {
      let t = providedToken ?? null
      if (!t) {
        try { t = useCookie('auth_token').value as unknown as string | null } catch {}
      }
      if (!t && typeof localStorage !== 'undefined') t = localStorage.getItem('auth_token')
      const permisos = extractPermisosFromToken(t)
      if (permisos.length) {
        setPantallas(permisos)
        return true
      }
    } catch {}
    return false
  }

  function reset() {
    pantallas.value = []
    try { localStorage.removeItem('auth_screens') } catch {}
  }

  function findByPath(ruta: string): PantallaBackend | undefined {
    const normalized = normalizePath(ruta)
    if (!normalized) return undefined
    return pantallas.value.find(p => normalizePath(p.path) === normalized)
  }

  const ALIAS: Record<string, AccionPermiso> = {
    ver: 'canRead', canRead: 'canRead',
    crear: 'canCreate', canCreate: 'canCreate',
    editar: 'canUpdate', canUpdate: 'canUpdate',
    eliminar: 'canDelete', canDelete: 'canDelete',
  }

  function can(ruta: string, accion: AccionPermiso | 'ver' | 'crear' | 'editar' | 'eliminar' = 'canRead'): boolean {
    const normalized = normalizePath(ruta)

    if (normalized === CONFIG_ROOT && (accion === 'canRead' || accion === 'ver')) {
      if (configGroups.value.length > 0) return true
    }
    return !!findByPath(ruta)?.[ALIAS[accion] ?? 'canRead']
  }

  return {
    pantallas,
    mainParents,
    mainNavItems,
    configGroups,
    setPantallas,
    loadFromStorage,
    loadFromToken,
    reset,
    can,
    findByPath,
  }
})