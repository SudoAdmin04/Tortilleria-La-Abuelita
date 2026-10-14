import { computed } from 'vue'
import type { NavigationMenuItem } from '#ui/types'
import { usePermisosStore } from '~/stores/permisos.store'

const CONFIG_ROOT = '/configuracion'
const FALLBACK_ICON = 'i-lucide-layout-dashboard'
const MAIN_ORDER = ['/dashboard', '/transacciones', '/presupuestos', '/analiticas', '/cuentas', '/configuracion']

function normalizePath(p: string | null | undefined): string {
  const s = (p ?? '').trim()
  return s.length > 1 && s.endsWith('/') ? s.slice(0, -1) : s
}

function normalizeIcon(icon: string | null | undefined): string {
  const s = (icon ?? '').trim()
  if (!s) return FALLBACK_ICON
  return s.startsWith('i-') ? s : `i-lucide-${s}`
}

/** Ruta con segmentos dinámicos estilo Nuxt (`[id]`) o express (`:id`): no navegable. */
function isDynamicPath(path: string): boolean {
  return path.includes('[') || path.split('/').some(s => s.startsWith(':'))
}

function isConfigPath(to: string): boolean {
  return to === CONFIG_ROOT || to.startsWith(`${CONFIG_ROOT}/`)
}

export const useMenu = () => {
  const permisosStore = usePermisosStore()
  const route = useRoute()

  /**
   * Menú principal en árbol: cada pantalla padre trae en `children` sus
   * pantallas hijas (por `parentId` o por prefijo de ruta, ej.
   * `/presupuestos/calendario` bajo `/presupuestos`). Las rutas dinámicas
   * (`/presupuestos/[id]`) se excluyen porque no son navegables.
   * Cada hija se asigna solo a su ancestro más cercano para no duplicarla
   * como entrada propia. El padre conserva su `to` (navega a su página) y el
   * chevron despliega las hijas (dropmenu).
   */
  const mainNavItems = computed<NavigationMenuItem[]>(() => {
    const legibles = permisosStore.pantallas.filter(p => p?.canRead && normalizePath(p.path))
    const ids = new Set(legibles.map(p => p.screenId))

    const candidatas = legibles.filter((p) => {
      const to = normalizePath(p.path)
      if (!to || isDynamicPath(to)) return false
      // La entrada `/configuracion` sí va en el sidebar (sus hijas las
      // muestra el SubmenuSidebar, no el menú principal).
      if (isConfigPath(to) && to !== CONFIG_ROOT) return false
      return true
    })

    const potPadres = candidatas
      .filter(p => p.parentId == null || !ids.has(p.parentId))

    // Ancestro más cercano de cada candidata (null = es raíz del menú).
    const ancestorDe = (c: (typeof candidatas)[number]) => {
      const cTo = normalizePath(c.path)
      if (isConfigPath(cTo)) return null
      if (typeof c.parentId === 'number') {
        const porId = potPadres.find(p => p.screenId === c.parentId && p.screenId !== c.screenId)
        if (porId) return porId
      }
      const porRuta = potPadres
        .filter(p => p.screenId !== c.screenId && cTo.startsWith(`${normalizePath(p.path)}/`))
        .sort((a, b) => normalizePath(b.path).length - normalizePath(a.path).length)
      return porRuta[0] ?? null
    }

    const hijasDe = new Map<number, (typeof candidatas)>()
    const esHija = new Set<number>()
    for (const c of candidatas) {
      const anc = ancestorDe(c)
      if (anc) {
        esHija.add(c.screenId)
        const arr = hijasDe.get(anc.screenId) ?? []
        arr.push(c)
        hijasDe.set(anc.screenId, arr)
      }
    }

    const padres = potPadres
      .filter(p => !esHija.has(p.screenId))
      .sort((a, b) => {
        const rank = (to: string) => {
          const i = MAIN_ORDER.indexOf(to)
          return i === -1 ? 99 : i
        }
        return rank(normalizePath(a.path)) - rank(normalizePath(b.path))
          || (a.screen ?? '').localeCompare(b.screen ?? '')
      })

    if (!padres.some(p => normalizePath(p.path) === CONFIG_ROOT)) {
      const hayHijasConfig = legibles.some((p) => {
        const to = normalizePath(p.path)
        return to !== CONFIG_ROOT && isConfigPath(to)
      })
      if (hayHijasConfig) {
        padres.push({
          screenId: -1,
          screen: 'Configuración',
          parentId: null,
          path: CONFIG_ROOT,
          icon: 'i-lucide-settings',
          module: 'configuracion',
          canRead: true,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
        })
      }
    }

    return padres.map((padre) => {
      const padreTo = normalizePath(padre.path)

      const hijas = (hijasDe.get(padre.screenId) ?? [])
        .sort((a, b) => (a.screen ?? '').localeCompare(b.screen ?? ''))

      const enSeccion = route.path === padreTo || route.path.startsWith(`${padreTo}/`)

      const item: NavigationMenuItem = {
        label: padre.screen ?? '',
        icon: normalizeIcon(padre.icon),
        to: padreTo,
      }

      if (hijas.length) {
        // Sin `type: 'trigger'`: el padre conserva sus props de enlace y
        // navega a su página al hacer clic; el chevron despliega las hijas.
        // Se repite el padre como primer hijo para que su página también sea
        // alcanzable desde el popover en modo colapsado.
        item.active = enSeccion
        item.defaultOpen = enSeccion
        item.children = [
          { label: padre.screen ?? '', icon: normalizeIcon(padre.icon), to: padreTo },
          ...hijas.map(h => ({
            label: h.screen ?? '',
            icon: normalizeIcon(h.icon),
            to: normalizePath(h.path),
          })),
        ]
      } else if (enSeccion) {
        item.active = true
      }

      return item
    })
  })

  return {
    mainNavItems,
    configGroups: computed(() => permisosStore.configGroups),
  }
}
