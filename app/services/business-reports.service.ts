import type { components } from '~/types/api'
import { useApi } from '~/composables/useApi'

export type BusinessDashboard = components['schemas']['BusinessDashboardResponseDto']
export type SalesReport = components['schemas']['SalesReportResponseDto']
export type PurchasesReport = components['schemas']['PurchasesReportResponseDto']
export type ProfitLossReport = components['schemas']['ProfitLossReportResponseDto']
export type BusinessPeriod = components['schemas']['ReportPeriodDto']
export type SalesKpi = components['schemas']['SalesKpiDto']
export type PurchasesKpi = components['schemas']['PurchasesKpiDto']
export type ProductionKpi = components['schemas']['ProductionKpiDto']
export type InventorySnapshot = components['schemas']['InventorySnapshotDto']
export type TopProduct = components['schemas']['TopProductDto']
export type DailySales = components['schemas']['DailySalesDto']
export type PaymentBreakdown = components['schemas']['PaymentBreakdownDto']

export interface BusinessReportQuery {
  from?: string
  to?: string
}

export function getBusinessDashboard(params: BusinessReportQuery = {}) {
  return useApi().api<BusinessDashboard>('/business/reports/dashboard', { query: { ...params } })
}

export function getSalesReport(params: BusinessReportQuery = {}) {
  return useApi().api<SalesReport>('/business/reports/sales', { query: { ...params } })
}

export function getPurchasesReport(params: BusinessReportQuery = {}) {
  return useApi().api<PurchasesReport>('/business/reports/purchases', { query: { ...params } })
}

export function getProfitLossReport(params: BusinessReportQuery = {}) {
  return useApi().api<ProfitLossReport>('/business/reports/profit-loss', { query: { ...params } })
}
