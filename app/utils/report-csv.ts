import type { Transaction } from '~/services/transactions.service'

const HEADERS = ['Fecha', 'Concepto', 'Tipo', 'Monto', 'Cuenta origen', 'Cuenta destino', 'Categoría', 'Estado']

function cell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

/** Convierte movimientos a CSV (separador coma, con BOM para Excel). */
export function transactionsToCsv(rows: Transaction[]): string {
  const lines = rows.map(t => [
    cell(t.date),
    cell(t.concept),
    cell(t.type),
    cell(t.amount),
    cell(t.account?.name ?? ''),
    cell(t.destinationAccount?.name ?? ''),
    cell(t.category?.name ?? ''),
    cell(t.status),
  ].join(','))
  return ['\uFEFF' + HEADERS.map(cell).join(','), ...lines].join('\r\n')
}

/** Descarga un string como archivo en el navegador. */
export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Primer/último día del mes en formato YYYY-MM-DD. */
export function monthRange(year: number, month: number): { from: string, to: string } {
  const mm = String(month).padStart(2, '0')
  const last = new Date(year, month, 0).getDate()
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${last}` }
}
