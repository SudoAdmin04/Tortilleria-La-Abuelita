import { useApi } from '~/composables/useApi'

export type ExportFormat = 'pdf' | 'xlsx'
export type ExportScope = 'dashboard' | 'transactions'
export type ExportGranularity = 'monthly' | 'quarterly' | 'annual'
export type ExportPaymentMethod = 'bank_transfer' | 'debit_card' | 'credit_card' | 'cash'

/** Filtros de `GET /exports/dashboard/{pdf|xlsx}` (los mismos del dashboard). */
export interface DashboardExportParams {
  year?: number
  month?: number
  granularity?: ExportGranularity
  accountId?: string
  paymentMethod?: ExportPaymentMethod
}

/** Filtros de `GET /exports/transactions/{pdf|xlsx}` (los mismos del listado). */
export interface TransactionsExportParams {
  page?: number
  limit?: number
  from?: string
  to?: string
  type?: 'income' | 'expense' | 'transfer'
  status?: 'pending' | 'reconciled'
  paymentMethod?: ExportPaymentMethod
  categoryId?: string
  accountId?: string
  search?: string
  order?: 'asc' | 'desc'
}

/**
 * Los endpoints de /exports responden binario. `responseType: 'blob'` también
 * evita que el plugin de API fuerce `Accept: application/json`.
 */
const BLOB_OPTIONS = { responseType: 'blob' as const }

function cleanQuery<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>
}

/** Descarga el dashboard completo (PDF o XLSX) para el periodo y filtros dados. */
export function exportDashboard(format: ExportFormat, params: DashboardExportParams = {}) {
  return useApi().api<Blob>(`/exports/dashboard/${format}`, {
    ...BLOB_OPTIONS,
    query: cleanQuery(params),
  })
}

/** Descarga el listado de transacciones filtradas (PDF o XLSX). */
export function exportTransactions(format: ExportFormat, params: TransactionsExportParams = {}) {
  return useApi().api<Blob>(`/exports/transactions/${format}`, {
    ...BLOB_OPTIONS,
    query: cleanQuery(params),
  })
}
