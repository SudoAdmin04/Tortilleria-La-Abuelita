import type { Granularity, MetodoPago } from '~/services/dashboard.service'

export type { Granularity, MetodoPago }

export interface CuentaOpt {
  value: string | undefined
  label: string
}

export interface DashboardFilters {
  granularity: Granularity
  accountId?: string
  paymentMethod?: MetodoPago
  search: string
}

export const GRANULARIDAD_OPTS: { value: Granularity, label: string, dot: string }[] = [
  { value: 'monthly', label: 'Mensual', dot: 'bg-green-500' },
  { value: 'quarterly', label: 'Trimestral', dot: 'bg-violet-400' },
  { value: 'annual', label: 'Anual', dot: 'bg-amber-400' },
]

export const METODO_PAGO_OPTS: { value: MetodoPago | undefined, label: string }[] = [
  { value: undefined, label: 'Todos los métodos' },
  { value: 'bank_transfer', label: 'Transferencia' },
  { value: 'debit_card', label: 'Débito' },
  { value: 'credit_card', label: 'Crédito' },
  { value: 'cash', label: 'Efectivo' },
]

export const DEFAULT_FILTERS: DashboardFilters = {
  granularity: 'monthly',
  accountId: undefined,
  paymentMethod: undefined,
  search: '',
}
