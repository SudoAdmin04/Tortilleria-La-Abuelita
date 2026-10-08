import type { MenuTreeNode } from '~/stores/permisos.store'

/** Ruta activa exacta o prefijo (`/configuracion/usuarios` activa `/configuracion`). */
export function isPathActive(to: string | undefined, path: string): boolean {
  if (!to) return false
  return path === to || path.startsWith(to + '/')
}

type TreeLike = Pick<MenuTreeNode, 'to' | 'children' | 'label' | 'icon'>

/** True si el nodo o algún descendiente coincide con la ruta actual. */
export function nodeContainsActive(node: TreeLike, path: string): boolean {
  if (isPathActive(node.to, path)) return true
  return (node.children ?? []).some(child => nodeContainsActive(child, path))
}

/** Aplana un bosque a solo nodos navegables (para modo colapsado / fallbacks). */
export function flattenNavigable(nodes: TreeLike[]): TreeLike[] {
  const out: TreeLike[] = []
  const walk = (ns: TreeLike[]) => {
    for (const n of ns) {
      if (n.to) out.push(n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return out
}
