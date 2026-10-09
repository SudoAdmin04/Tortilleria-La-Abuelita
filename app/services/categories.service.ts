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

export async function listCategories(tree = false): Promise<Category[] | CategoryTree[]> {
  const res = await useApi().api<any>('/categories', { query: tree ? { tree: 'true' } : {} })
  if (Array.isArray(res)) return res
  return res?.items ?? res?.data ?? []
}

export async function listCategoriesPaginado(params: PaginadoParams = {}) {
  const res = await useApi().api<any>('/categories/paginado', { query: { ...params } })
  return norm<Category>(res)
}

export function createCategory(payload: CreateCategory) {
  return useApi().api<Category>('/categories', { method: 'POST', body: payload })
}

export function getCategory(id: string) {
  return useApi().api<Category>(`/categories/${id}`)
}

export function updateCategory(id: string, payload: UpdateCategory) {
  return useApi().api<Category>(`/categories/${id}`, { method: 'PATCH', body: payload })
}

export function deleteCategory(id: string) {
  return useApi().api<void>(`/categories/${id}`, { method: 'DELETE' })
}

export function toggleCategoryActive(id: string) {
  return useApi().api<Category>(`/categories/${id}/toggle-active`, { method: 'PATCH' })
}
