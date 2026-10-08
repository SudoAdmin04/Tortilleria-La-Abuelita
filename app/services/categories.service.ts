import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Category = components['schemas']['CategoryResponseDto']
export type CategoryTree = components['schemas']['CategoryTreeResponseDto']
export type CreateCategory = components['schemas']['CreateCategoryDto']
export type UpdateCategory = components['schemas']['UpdateCategoryDto']

export interface PaginadoParams { pagina?: number; registros?: number; buscar?: string }

function norm<T>(res: any): { data: T[]; total: number } {
  return { data: res?.data ?? res?.items ?? (Array.isArray(res) ? res : []), total: res?.total ?? 0 }
}

/**
 * GET /categories — plana por defecto (`Category[]`); con `tree: true`
 * devuelve rubros con `children` (partidas) anidadas (`CategoryTree[]`).
 * El backend envuelve en `{ items }`: aquí se desenvuelve a arreglo
 * para no romper a los consumidores (`useCatalogos`, `catalogos.store`, etc.).
 */
export async function listCategories(tree = false): Promise<Category[] | CategoryTree[]> {
  const res = await useApi().api<any>('/categories', { query: tree ? { tree: 'true' } : {} })
  if (Array.isArray(res)) return res
  return res?.items ?? res?.data ?? []
}

/**
 * GET /categories/paginado — paginado en servidor (`?pagina&registros&buscar`).
 * Devuelve `{ data: CategoryResponseDto[], total }` (lista plana, sin árbol).
 */
export async function listCategoriesPaginado(params: PaginadoParams = {}) {
  const res = await useApi().api<any>('/categories/paginado', { query: { ...params } })
  return norm<Category>(res)
}

/** POST /categories — rubro (sin parentId + kind) o partida (con parentId, hereda kind). */
export function createCategory(payload: CreateCategory) {
  return useApi().api<Category>('/categories', { method: 'POST', body: payload })
}

/** GET /categories/:id */
export function getCategory(id: string) {
  return useApi().api<Category>(`/categories/${id}`)
}

/** PATCH /categories/:id — no permite mover de rubro ni cambiar kind. */
export function updateCategory(id: string, payload: UpdateCategory) {
  return useApi().api<Category>(`/categories/${id}`, { method: 'PATCH', body: payload })
}

/** DELETE /categories/:id — 409 si tiene partidas o movimientos (desactivar en su lugar). */
export function deleteCategory(id: string) {
  return useApi().api<void>(`/categories/${id}`, { method: 'DELETE' })
}

/** PATCH /categories/:id/toggle-active — activa o desactiva sin body. */
export function toggleCategoryActive(id: string) {
  return useApi().api<Category>(`/categories/${id}/toggle-active`, { method: 'PATCH' })
}
