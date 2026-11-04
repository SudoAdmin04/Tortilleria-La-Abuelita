<script setup lang="ts">
import { formatMoney, formatDate } from '~/utils/format'

useHead({ title: 'Reporte del negocio' })

const r = useReportesNegocio()
const auth = useAuthStore()
const currency = computed(() => auth.user?.currency || 'MXN')

const dashboard = computed(() => r.dashboard.value)
const sales = computed(() => dashboard.value?.sales)
const purchases = computed(() => dashboard.value?.purchases)
const production = computed(() => dashboard.value?.production)
const inventory = computed(() => dashboard.value?.inventory)

const cargando = computed(() => r.loadingDashboard.value)

const stats = computed(() => {
  const s = sales.value
  const p = purchases.value
  const i = inventory.value
  return [
    {
      label: 'Ventas del periodo',
      value: formatMoney(s?.total ?? 0, currency.value),
      sub: `${s?.count ?? 0} ventas · ticket ${formatMoney(s?.averageTicket ?? 0, currency.value)}`,
      icon: 'i-lucide-badge-dollar-sign',
      tone: 'success' as const,
    },
    {
      label: 'Compras del periodo',
      value: formatMoney(p?.total ?? 0, currency.value),
      sub: `${p?.count ?? 0} compras · promedio ${formatMoney(p?.average ?? 0, currency.value)}`,
      icon: 'i-lucide-shopping-cart',
      tone: 'warning' as const,
    },
    {
      label: 'Utilidad bruta',
      value: formatMoney(s?.grossProfit ?? 0, currency.value),
      sub: `Margen ${(s?.grossMarginPercent ?? 0).toFixed(1)}% · COGS ${formatMoney(s?.cogs ?? 0, currency.value)}`,
      icon: 'i-lucide-trending-up',
      tone: (s?.grossProfit ?? 0) >= 0 ? 'success' as const : 'danger' as const,
      progress: Math.min(Math.max(s?.grossMarginPercent ?? 0, 0), 100),
    },
    {
      label: 'Valor del inventario',
      value: formatMoney(i?.totalValue ?? 0, currency.value),
      sub: `${i?.lowStockCount ?? 0} en stock bajo · ${i?.outOfStockCount ?? 0} agotado(s)`,
      icon: 'i-lucide-boxes',
      tone: (i?.lowStockCount ?? 0) > 0 ? 'warning' as const : 'neutral' as const,
    },
  ]
})

const topProducts = computed(() => dashboard.value?.topProducts ?? [])
const dailySales = computed(() => dashboard.value?.dailySales ?? [])
const bySupplier = computed(() => r.purchasesReport.value?.bySupplier ?? [])
const bySupply = computed(() => r.purchasesReport.value?.bySupply ?? [])
const byPaymentMethod = computed(() => r.salesReport.value?.byPaymentMethod ?? [])

const metodosPagoLabel: Record<string, string> = {
  cash: 'Efectivo',
  debit_card: 'Tarjeta de débito',
  credit_card: 'Tarjeta de crédito',
  bank_transfer: 'Transferencia',
}

function aplicar() {
  r.fetchAll()
}

onMounted(() => {
  r.fetchAll()
})
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Reporte del negocio"
      description="Ventas, compras, producción e inventario del periodo"
      hide-search
    >
      <template #actions>
        <UButton to="/reportes/resultados" color="neutral" variant="outline" size="sm" icon="i-lucide-chart-pie">
          Estado de resultados
        </UButton>
        <UButton to="/reportes" color="neutral" variant="outline" size="sm" icon="i-lucide-files">
          Reportes financieros
        </UButton>
      </template>
    </AppToolbar>

    <UAlert
      v-if="r.error.value && !dashboard"
      color="error"
      variant="subtle"
      title="No se pudo cargar el reporte"
      :description="r.error.value"
    />

    <ReportesNegocioFilters
      v-model:from="r.filter.from"
      v-model:to="r.filter.to"
      :loading="cargando"
      @filtrar="aplicar"
    />

    <AppStatCards :stats="stats" :loading="cargando && !dashboard" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <UCard class="border border-default" :ui="{ body: 'p-5 space-y-1' }">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-factory" class="size-4 text-primary" />
          <span class="text-xs uppercase tracking-widest text-muted">Producción</span>
        </div>
        <p class="text-2xl font-bold text-highlighted">{{ production?.count ?? 0 }} lotes</p>
        <p class="text-xs text-muted">
          {{ production?.quantity ?? 0 }} unidades · costo {{ formatMoney(production?.totalCost ?? 0, currency) }}
        </p>
      </UCard>
      <UCard class="border border-default" :ui="{ body: 'p-5 space-y-1' }">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-wheat" class="size-4 text-emerald-600 dark:text-emerald-400" />
          <span class="text-xs uppercase tracking-widest text-muted">Insumos</span>
        </div>
        <p class="text-2xl font-bold text-highlighted">{{ inventory?.suppliesCount ?? 0 }}</p>
        <p class="text-xs text-muted">Valorados en {{ formatMoney(inventory?.suppliesValue ?? 0, currency) }}</p>
      </UCard>
      <UCard class="border border-default" :ui="{ body: 'p-5 space-y-1' }">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-cookie" class="size-4 text-sky-600 dark:text-sky-400" />
          <span class="text-xs uppercase tracking-widest text-muted">Productos</span>
        </div>
        <p class="text-2xl font-bold text-highlighted">{{ inventory?.productsCount ?? 0 }}</p>
        <p class="text-xs text-muted">Valorados en {{ formatMoney(inventory?.productsValue ?? 0, currency) }}</p>
      </UCard>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <UCard class="border border-default overflow-hidden" :ui="{ body: 'p-0 overflow-x-auto' }">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-bold text-highlighted">Productos más vendidos</span>
            <UBadge size="sm" color="primary" variant="subtle" class="font-semibold">{{ topProducts.length }}</UBadge>
          </div>
        </template>
        <table class="w-full text-sm">
          <thead class="bg-elevated/60 text-muted text-xs uppercase tracking-wider">
            <tr>
              <th class="text-left font-semibold px-4 py-2.5">Producto</th>
              <th class="text-right font-semibold px-4 py-2.5">Cantidad</th>
              <th class="text-right font-semibold px-4 py-2.5">Ingreso</th>
              <th class="text-right font-semibold px-4 py-2.5">Utilidad</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="p in topProducts" :key="p.productId" class="hover:bg-elevated/50">
              <td class="px-4 py-2.5 text-highlighted truncate max-w-64">{{ p.productName }}</td>
              <td class="px-4 py-2.5 text-right text-toned whitespace-nowrap">{{ p.quantity }}</td>
              <td class="px-4 py-2.5 text-right text-highlighted whitespace-nowrap">{{ formatMoney(p.revenue, currency) }}</td>
              <td class="px-4 py-2.5 text-right whitespace-nowrap font-semibold" :class="p.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                {{ formatMoney(p.profit, currency) }}
              </td>
            </tr>
            <tr v-if="!topProducts.length">
              <td colspan="4" class="px-4 py-10 text-center text-muted">Sin ventas en el periodo.</td>
            </tr>
          </tbody>
        </table>
      </UCard>

      <UCard class="border border-default overflow-hidden" :ui="{ body: 'p-0 overflow-x-auto' }">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-bold text-highlighted">Ventas por día</span>
            <UBadge size="sm" color="neutral" variant="subtle" class="font-semibold">{{ dailySales.length }}</UBadge>
          </div>
        </template>
        <table class="w-full text-sm">
          <thead class="bg-elevated/60 text-muted text-xs uppercase tracking-wider">
            <tr>
              <th class="text-left font-semibold px-4 py-2.5">Fecha</th>
              <th class="text-right font-semibold px-4 py-2.5">Ventas</th>
              <th class="text-right font-semibold px-4 py-2.5">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="d in dailySales" :key="d.date" class="hover:bg-elevated/50">
              <td class="px-4 py-2.5 text-toned whitespace-nowrap">{{ formatDate(d.date) }}</td>
              <td class="px-4 py-2.5 text-right text-toned">{{ d.count }}</td>
              <td class="px-4 py-2.5 text-right text-highlighted font-semibold whitespace-nowrap">{{ formatMoney(d.total, currency) }}</td>
            </tr>
            <tr v-if="!dailySales.length">
              <td colspan="3" class="px-4 py-10 text-center text-muted">Sin ventas en el periodo.</td>
            </tr>
          </tbody>
        </table>
      </UCard>

      <UCard class="border border-default overflow-hidden" :ui="{ body: 'p-0 overflow-x-auto' }">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-bold text-highlighted">Compras por proveedor</span>
            <UBadge size="sm" color="neutral" variant="subtle" class="font-semibold">{{ bySupplier.length }}</UBadge>
          </div>
        </template>
        <table class="w-full text-sm">
          <thead class="bg-elevated/60 text-muted text-xs uppercase tracking-wider">
            <tr>
              <th class="text-left font-semibold px-4 py-2.5">Proveedor</th>
              <th class="text-right font-semibold px-4 py-2.5">Compras</th>
              <th class="text-right font-semibold px-4 py-2.5">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="s in bySupplier" :key="s.supplierId" class="hover:bg-elevated/50">
              <td class="px-4 py-2.5 text-highlighted truncate max-w-64">{{ s.supplierName }}</td>
              <td class="px-4 py-2.5 text-right text-toned">{{ s.count }}</td>
              <td class="px-4 py-2.5 text-right text-highlighted font-semibold whitespace-nowrap">{{ formatMoney(s.total, currency) }}</td>
            </tr>
            <tr v-if="!bySupplier.length">
              <td colspan="3" class="px-4 py-10 text-center text-muted">Sin compras en el periodo.</td>
            </tr>
          </tbody>
        </table>
      </UCard>

      <UCard class="border border-default overflow-hidden" :ui="{ body: 'p-0 overflow-x-auto' }">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-bold text-highlighted">Compras por insumo</span>
            <UBadge size="sm" color="neutral" variant="subtle" class="font-semibold">{{ bySupply.length }}</UBadge>
          </div>
        </template>
        <table class="w-full text-sm">
          <thead class="bg-elevated/60 text-muted text-xs uppercase tracking-wider">
            <tr>
              <th class="text-left font-semibold px-4 py-2.5">Insumo</th>
              <th class="text-right font-semibold px-4 py-2.5">Cantidad</th>
              <th class="text-right font-semibold px-4 py-2.5">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="s in bySupply" :key="s.supplyId" class="hover:bg-elevated/50">
              <td class="px-4 py-2.5 text-highlighted truncate max-w-64">{{ s.supplyName }}</td>
              <td class="px-4 py-2.5 text-right text-toned whitespace-nowrap">{{ s.quantity }} {{ s.unit }}</td>
              <td class="px-4 py-2.5 text-right text-highlighted font-semibold whitespace-nowrap">{{ formatMoney(s.total, currency) }}</td>
            </tr>
            <tr v-if="!bySupply.length">
              <td colspan="3" class="px-4 py-10 text-center text-muted">Sin compras en el periodo.</td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </div>

    <UCard v-if="byPaymentMethod.length" class="border border-default overflow-hidden" :ui="{ body: 'p-0 overflow-x-auto' }">
      <template #header>
        <span class="text-sm font-bold text-highlighted">Ventas por forma de pago</span>
      </template>
      <table class="w-full text-sm">
        <thead class="bg-elevated/60 text-muted text-xs uppercase tracking-wider">
          <tr>
            <th class="text-left font-semibold px-4 py-2.5">Forma de pago</th>
            <th class="text-right font-semibold px-4 py-2.5">Operaciones</th>
            <th class="text-right font-semibold px-4 py-2.5">Total</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="m in byPaymentMethod" :key="m.paymentMethod" class="hover:bg-elevated/50">
            <td class="px-4 py-2.5 text-highlighted">{{ metodosPagoLabel[m.paymentMethod] ?? m.paymentMethod }}</td>
            <td class="px-4 py-2.5 text-right text-toned">{{ m.count }}</td>
            <td class="px-4 py-2.5 text-right text-highlighted font-semibold whitespace-nowrap">{{ formatMoney(m.total, currency) }}</td>
          </tr>
        </tbody>
      </table>
    </UCard>
  </div>
</template>
