import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Category = components['schemas']['CategoryResponseDto']
export type CategoryTree = components['schemas']['CategoryTreeResponseDto']
export type CreateCategory = components['schemas']['CreateCategoryDto']
export type UpdateCategory = components['schemas']['UpdateCategoryDto']

/** GET /categories — plana por defecto; `tree: true` agrupa partidas en su rubro. */
export function listCategories(tree = false) {
  return useApi().api<Category[] | CategoryTree[]>('/categories', { query: tree ? { tree: 'true' } : {} })
}

/** POST /categories — rubro (sin parentId + kind) o partida (con parentId). */
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
