<script setup lang="ts">
import { formatMoney, formatDate } from '~/utils/format'

useHead({ title: 'Estado de resultados' })

const r = useReportesNegocio()
const auth = useAuthStore()
const currency = computed(() => auth.user?.currency || 'MXN')

const pl = computed(() => r.profitLoss.value)
const revenue = computed(() => pl.value?.revenue)
const result = computed(() => pl.value?.result)

const cargando = computed(() => r.loadingProfitLoss.value)

const stats = computed(() => {
  const rev = revenue.value
  const res = result.value
  return [
    {
      label: 'Ingresos totales',
      value: formatMoney(rev?.totalIncome ?? 0, currency.value),
      sub: `Ventas ${formatMoney(rev?.sales ?? 0, currency.value)}`,
      icon: 'i-lucide-arrow-down-to-line',
      tone: 'success' as const,
    },
    {
      label: 'Costo de ventas',
      value: formatMoney(res?.cogs ?? 0, currency.value),
      sub: 'Costo de los productos vendidos (COGS)',
      icon: 'i-lucide-package',
      tone: 'neutral' as const,
    },
    {
      label: 'Utilidad bruta',
      value: formatMoney(res?.grossProfit ?? 0, currency.value),
      sub: `Margen ${(res?.grossMarginPercent ?? 0).toFixed(1)}%`,
      icon: 'i-lucide-trending-up',
      tone: (res?.grossProfit ?? 0) >= 0 ? 'success' as const : 'danger' as const,
      progress: Math.min(Math.max(res?.grossMarginPercent ?? 0, 0), 100),
    },
    {
      label: 'Utilidad neta',
      value: formatMoney(res?.netProfit ?? 0, currency.value),
      sub: `Margen ${(res?.netMarginPercent ?? 0).toFixed(1)}%`,
      icon: 'i-lucide-scale',
      tone: (res?.netProfit ?? 0) >= 0 ? 'success' as const : 'danger' as const,
    },
  ]
})

const lineas = computed(() => {
  const rev = revenue.value
  const res = result.value
  return [
    { label: 'Ventas del periodo', amount: rev?.sales ?? 0, kind: 'positive' as const },
    { label: 'Ingresos totales (incluye otros ingresos)', amount: rev?.totalIncome ?? 0, kind: 'positive' as const, bold: true },
    { label: 'Costo de ventas (COGS)', amount: res?.cogs ?? 0, kind: 'negative' as const },
    { label: 'Utilidad bruta', amount: res?.grossProfit ?? 0, kind: 'total' as const, sub: `Margen ${(res?.grossMarginPercent ?? 0).toFixed(1)}%` },
    { label: 'Egresos totales (compras y gastos)', amount: rev?.totalExpenses ?? 0, kind: 'negative' as const },
    { label: 'Utilidad neta', amount: res?.netProfit ?? 0, kind: 'total' as const, sub: `Margen ${(res?.netMarginPercent ?? 0).toFixed(1)}%` },
  ]
})

function aplicar() {
  r.fetchProfitLoss()
}

onMounted(() => {
  r.fetchProfitLoss()
})
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Estado de resultados"
      description="Ingresos, costo de ventas y utilidad del periodo"
      hide-search
    >
      <template #actions>
        <UButton to="/reportes/negocio" color="neutral" variant="outline" size="sm" icon="i-lucide-store">
          Reporte del negocio
        </UButton>
        <UButton to="/reportes" color="neutral" variant="outline" size="sm" icon="i-lucide-files">
          Reportes financieros
        </UButton>
      </template>
    </AppToolbar>

    <UAlert
      v-if="r.error.value && !pl"
      color="error"
      variant="subtle"
      title="No se pudo cargar el estado de resultados"
      :description="r.error.value"
    />

    <ReportesNegocioFilters
      v-model:from="r.filter.from"
      v-model:to="r.filter.to"
      :loading="cargando"
      @filtrar="aplicar"
    />

    <AppStatCards :stats="stats" :loading="cargando && !pl" />

    <UCard class="border border-default overflow-hidden" :ui="{ body: 'p-0' }">
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span class="text-sm font-bold text-highlighted">Detalle del estado de resultados</span>
          <span v-if="pl?.period" class="text-xs text-muted">
            {{ formatDate(pl.period.from) }} — {{ formatDate(pl.period.to) }}
          </span>
        </div>
      </template>

      <div class="divide-y divide-default">
        <div
          v-for="linea in lineas"
          :key="linea.label"
          class="flex items-center justify-between gap-4 px-5 py-3.5"
          :class="linea.kind === 'total' ? 'bg-elevated/60' : ''"
        >
          <div class="flex flex-col min-w-0">
            <span
              class="text-sm"
              :class="linea.kind === 'total' ? 'font-bold text-highlighted' : 'text-toned'"
            >
              {{ linea.label }}
            </span>
            <span v-if="linea.sub" class="text-xs text-muted">{{ linea.sub }}</span>
          </div>
          <span
            class="text-sm whitespace-nowrap font-semibold"
            :class="[
              linea.kind === 'total' ? 'text-base font-bold' : '',
              linea.kind === 'negative' ? 'text-red-600 dark:text-red-400' : '',
              linea.kind === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : '',
              linea.kind === 'total' ? (linea.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400') : '',
            ]"
          >
            {{ linea.kind === 'negative' ? '-' : '' }}{{ formatMoney(Math.abs(linea.amount), currency) }}
          </span>
        </div>
      </div>
    </UCard>

    <UAlert
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      title="Cómo se calcula"
      description="La utilidad bruta es ventas menos el costo de los productos vendidos. La utilidad neta es el total de ingresos menos el total de egresos registrados en finanzas (incluye compras de insumos y gastos operativos)."
    />
  </div>
</template>
