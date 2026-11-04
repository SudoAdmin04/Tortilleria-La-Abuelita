import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type Product = components['schemas']['ProductResponseDto']
export type CreateProduct = components['schemas']['CreateProductDto']
export type UpdateProduct = components['schemas']['UpdateProductDto']
export type ProductRecipe = components['schemas']['RecipeResponseDto']
export type RecipeItem = components['schemas']['RecipeItemDto']
export type SetRecipe = components['schemas']['SetRecipeDto']
export type ProductUnit = Product['unit']

export const PRODUCT_UNITS: { value: ProductUnit; label: string }[] = [
  { value: 'kg', label: 'Kilogramo' },
  { value: 'piece', label: 'Pieza' },
  { value: 'dozen', label: 'Docena' },
  { value: 'pack', label: 'Paquete' },
  { value: 'box', label: 'Caja' },
]

export function productUnitLabel(unit: string | null | undefined): string {
  return PRODUCT_UNITS.find(u => u.value === unit)?.label ?? unit ?? '—'
}

export interface ProductPaginadoParams {
  pagina?: number
  registros?: number
  buscar?: string
  isActive?: boolean
  lowStock?: boolean
}

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const body = res as { items?: T[]; data?: T[] } | null | undefined
  return body?.items ?? body?.data ?? []
}

export async function listProducts(): Promise<Product[]> {
  const res = await useApi().api<unknown>('/products')
  return unwrap<Product>(res)
}

export async function listProductsPaginado(params: ProductPaginadoParams = {}) {
  const res = await useApi().api<any>('/products/paginado', { query: { ...params } })
  return { data: unwrap<Product>(res), total: Number(res?.total ?? 0) }
}

export function createProduct(payload: CreateProduct) {
  return useApi().api<Product>('/products', { method: 'POST', body: payload })
}

export function getProduct(id: string) {
  return useApi().api<Product>(`/products/${id}`)
}

export function updateProduct(id: string, payload: UpdateProduct) {
  return useApi().api<Product>(`/products/${id}`, { method: 'PATCH', body: payload })
}

export function deleteProduct(id: string) {
  return useApi().api<void>(`/products/${id}`, { method: 'DELETE' })
}

export function toggleProductActive(id: string) {
  return useApi().api<Product>(`/products/${id}/toggle-active`, { method: 'PATCH' })
}

export async function getProductRecipe(id: string): Promise<ProductRecipe[]> {
  const res = await useApi().api<unknown>(`/products/${id}/recipe`)
  return unwrap<ProductRecipe>(res)
}

export function setProductRecipe(id: string, payload: SetRecipe) {
  return useApi().api<Product>(`/products/${id}/recipe`, { method: 'PUT', body: payload })
}
