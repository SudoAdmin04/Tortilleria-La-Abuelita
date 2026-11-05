import {
  exportDashboard,
  exportTransactions,
  type DashboardExportParams,
  type ExportFormat,
  type ExportScope,
  type TransactionsExportParams,
} from '~/services/exports.repository'
import { getApiMessage } from '~/utils/api-error'

export type { DashboardExportParams, ExportFormat, ExportScope, TransactionsExportParams }

const MIME: Record<ExportFormat, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function todayStamp(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** Nombre de archivo legible cuando el backend no envía `Content-Disposition`. */
function buildFilename(
  scope: ExportScope,
  format: ExportFormat,
  params: DashboardExportParams | TransactionsExportParams,
): string {
  if (scope === 'dashboard') {
    const { year, month } = params as DashboardExportParams
    const suffix = year && month ? `${year}-${pad(month)}` : todayStamp()
    return `dashboard-${suffix}.${format}`
  }

  const { from, to } = params as TransactionsExportParams
  const suffix = from && to ? `${from}_${to}` : todayStamp()
  return `transacciones-${suffix}.${format}`
}

function saveBlob(blob: Blob, filename: string) {
  if (!import.meta.client) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Los errores llegan como Blob porque la petición pidió binario. */
async function resolveErrorMessage(error: unknown, fallback: string): Promise<string> {
  const data = (error as { data?: unknown })?.data
  if (data instanceof Blob && data.type.includes('json')) {
    try {
      const parsed = JSON.parse(await data.text())
      const message = Array.isArray(parsed?.message) ? parsed.message.join(', ') : parsed?.message
      if (typeof message === 'string' && message) return message
    } catch {}
  }
  return getApiMessage(error, fallback)
}

/**
 * Descarga reportes generados por el backend (`/exports/*`) y expone el estado
 * de carga por scope+formato para que los botones muestren su spinner.
 */
export function useExports() {
  const toast = useToast()
  const loadingKey = ref<string | null>(null)

  function isExporting(scope: ExportScope, format: ExportFormat): boolean {
    return loadingKey.value === `${scope}:${format}`
  }

  async function download(
    scope: ExportScope,
    format: ExportFormat,
    params: DashboardExportParams | TransactionsExportParams = {},
    filename?: string,
  ): Promise<boolean> {
    if (!import.meta.client) return false

    loadingKey.value = `${scope}:${format}`
    try {
      const result = scope === 'dashboard'
        ? await exportDashboard(format, params as DashboardExportParams)
        : await exportTransactions(format, params as TransactionsExportParams)

      // El backend puede responder 200 con JSON (p. ej. "sin datos"): no lo guardamos como archivo.
      if (result.type.includes('json')) {
        const parsed = JSON.parse(await result.text())
        toast.add({
          title: 'Sin reporte para exportar',
          description: parsed?.message ?? 'No hay datos con los filtros actuales.',
          color: 'warning',
          icon: 'i-lucide-triangle-alert',
        })
        return false
      }

      const blob = result instanceof Blob
        ? result
        : new Blob([result as BlobPart], { type: MIME[format] })

      saveBlob(blob, filename ?? buildFilename(scope, format, params))
      toast.add({
        title: 'Reporte descargado',
        description: `Archivo ${format.toUpperCase()} generado correctamente.`,
        color: 'success',
        icon: 'i-lucide-circle-check',
      })
      return true
    } catch (error: unknown) {
      toast.add({
        title: 'Error al exportar',
        description: await resolveErrorMessage(error, 'No se pudo generar el reporte'),
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      })
      return false
    } finally {
      loadingKey.value = null
    }
  }

  function downloadDashboard(
    format: ExportFormat,
    params: DashboardExportParams = {},
    filename?: string,
  ) {
    return download('dashboard', format, params, filename)
  }

  function downloadTransactions(
    format: ExportFormat,
    params: TransactionsExportParams = {},
    filename?: string,
  ) {
    return download('transactions', format, params, filename)
  }

  return { loadingKey, isExporting, download, downloadDashboard, downloadTransactions }
}
