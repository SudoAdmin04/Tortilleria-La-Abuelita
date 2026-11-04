import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type InventorySummary = components['schemas']['InventorySummaryDto']
export type InventoryMovement = components['schemas']['InventoryMovementResponseDto']
export type LowStockItem = components['schemas']['LowStockItemDto']
export type AdjustInventory = components['schemas']['AdjustInventoryDto']
export type InventoryItemType = InventoryMovement['itemType']
export type InventoryMovementType = InventoryMovement['type']

export interface InventoryMovementsParams {
  page?: number
  limit?: number
  itemType?: InventoryItemType
  type?: InventoryMovementType
  supplyId?: string
  productId?: string
  referenceType?: string
  from?: string
  to?: string
}

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const body = res as { items?: T[]; data?: T[] } | null | undefined
  return body?.items ?? body?.data ?? []
}

export function getInventorySummary() {
  return useApi().api<InventorySummary>('/inventory/summary')
}

export async function getLowStock(): Promise<LowStockItem[]> {
  const res = await useApi().api<unknown>('/inventory/low-stock')
  return unwrap<LowStockItem>(res)
}

export async function listInventoryMovements(params: InventoryMovementsParams = {}) {
  const res = await useApi().api<any>('/inventory/movements', { query: { ...params } })
  return {
    items: unwrap<InventoryMovement>(res),
    total: Number(res?.total ?? 0),
    page: Number(res?.page ?? 1),
    limit: Number(res?.limit ?? 25),
    pages: Number(res?.pages ?? 1),
  }
}

export function adjustInventory(payload: AdjustInventory) {
  return useApi().api<InventoryMovement>('/inventory/adjustments', { method: 'POST', body: payload })
}
