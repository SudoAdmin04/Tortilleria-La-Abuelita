import {
  getBusinessDashboard,
  getSalesReport,
  getPurchasesReport,
  getProfitLossReport,
  type BusinessDashboard,
  type SalesReport,
  type PurchasesReport,
  type ProfitLossReport,
} from '~/services/business-reports.service'
import { getApiMessage } from '~/utils/api-error'
import { currentMonthRange } from '~/utils/date-range'

export type { BusinessDashboard, SalesReport, PurchasesReport, ProfitLossReport }

export const useReportesNegocio = () => {
  const rango = currentMonthRange()
  const filter = reactive({
    from: rango.from,
    to: rango.to,
  })

  const dashboard = ref<BusinessDashboard | null>(null)
  const salesReport = ref<SalesReport | null>(null)
  const purchasesReport = ref<PurchasesReport | null>(null)
  const profitLoss = ref<ProfitLossReport | null>(null)

  const loadingDashboard = ref(false)
  const loadingSales = ref(false)
  const loadingPurchases = ref(false)
  const loadingProfitLoss = ref(false)
  const error = ref<string | null>(null)

  async function fetchDashboard() {
    loadingDashboard.value = true
    error.value = null
    try {
      dashboard.value = await getBusinessDashboard({ ...filter })
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'No se pudo cargar el dashboard del negocio')
    } finally {
      loadingDashboard.value = false
    }
  }

  async function fetchSalesReport() {
    loadingSales.value = true
    try {
      salesReport.value = await getSalesReport({ ...filter })
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'No se pudo cargar el reporte de ventas')
    } finally {
      loadingSales.value = false
    }
  }

  async function fetchPurchasesReport() {
    loadingPurchases.value = true
    try {
      purchasesReport.value = await getPurchasesReport({ ...filter })
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'No se pudo cargar el reporte de compras')
    } finally {
      loadingPurchases.value = false
    }
  }

  async function fetchProfitLoss() {
    loadingProfitLoss.value = true
    error.value = null
    try {
      profitLoss.value = await getProfitLossReport({ ...filter })
    } catch (e: unknown) {
      error.value = getApiMessage(e, 'No se pudo cargar el estado de resultados')
    } finally {
      loadingProfitLoss.value = false
    }
  }

  function fetchAll() {
    return Promise.allSettled([fetchDashboard(), fetchSalesReport(), fetchPurchasesReport(), fetchProfitLoss()])
  }

  return {
    filter,
    dashboard,
    salesReport,
    purchasesReport,
    profitLoss,
    loadingDashboard,
    loadingSales,
    loadingPurchases,
    loadingProfitLoss,
    error,
    fetchDashboard,
    fetchSalesReport,
    fetchPurchasesReport,
    fetchProfitLoss,
    fetchAll,
  }
}
