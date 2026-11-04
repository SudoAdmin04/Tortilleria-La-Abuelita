<script setup lang="ts">
import { formatCompact, formatMoney } from '~/utils/format'

useHead({ title: 'Analíticas' })

const auth = useAuthStore()
const currency = computed(() => auth.user?.currency || 'MXN')

const a = useAnaliticas()

function signedMoney(v: number): string {
  if (v > 0) return `+${formatMoney(v, currency.value)}`
  if (v < 0) return `−${formatMoney(Math.abs(v), currency.value)}`
  return formatMoney(0, currency.value)
}

const stats = computed(() => {
  const k = a.kpis.value
  const cumpleMeta = (k.savingsRate ?? 0) >= k.savingsTargetPercent
  return [
    {
      label: 'Tasa de ahorro',
      value: k.savingsRate == null ? '—' : `${k.savingsRate}%`,
      sub: `Meta ${k.savingsTargetPercent}% · brecha ${formatMoney(k.savingsGap, currency.value)}`,
      icon: 'i-lucide-piggy-bank',
      tone: (cumpleMeta ? 'success' : 'warning') as const,
      progress: k.savingsRate,
    },
    {
      label: 'Liquidez',
      value: formatMoney(k.liquid, currency.value),
      sub: `Egreso prom. ${formatCompact(k.averageMonthlyExpense, currency.value)}/mes`,
      icon: 'i-lucide-landmark',
      tone: 'neutral' as const,
    },
    {
      label: 'Meses de reserva',
      value: `${k.runwayMonths}`,
      sub: `Ingreso prom. ${formatCompact(k.averageIncome, currency.value)}/mes`,
      icon: 'i-lucide-hourglass',
      tone: 'primary' as const,
    },
    {
      label: 'Desviación gasto',
      value: signedMoney(k.expenseDeviation),
      sub: k.expenseMoM == null ? 'Sin comparativa mensual' : `Mes anterior ${k.expenseMoM > 0 ? '+' : ''}${k.expenseMoM}%`,
      icon: 'i-lucide-trending-up',
      tone: (k.expenseDeviation > 0 ? 'danger' : 'success') as const,
    },
  ]
})

onMounted(() => a.fetchAnaliticas())
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Analíticas"
      description="Cashflow, KPIs, fugas y alertas"
      icon="i-lucide-chart-no-axes-combined"
      :hide-search="true"
    >
      <template #actions>
        <UButton to="/reportes" color="neutral" variant="outline" size="sm" icon="i-lucide-layout-dashboard">
          Resumen
        </UButton>
        <UButton to="/reportes/analiticas" color="primary" variant="solid" size="sm" icon="i-lucide-chart-no-axes-combined">
          Analíticas
        </UButton>
        <UButton to="/reportes/presupuestos" color="neutral" variant="outline" size="sm" icon="i-lucide-wallet">
          Presupuesto
        </UButton>
      </template>
    </AppToolbar>

    <UAlert
      v-if="a.error.value && !a.data.value"
      color="error"
      variant="subtle"
      title="No se pudieron cargar las analíticas"
      :description="a.error.value"
    />

    <AppStatCards :stats="stats" :loading="a.loading.value && !a.data.value" :columns="4" />

    <ReportesAnaliticasFilters
      v-model:year="a.filter.year"
      v-model:month="a.filter.month"
      v-model:months="a.filter.months"
      v-model:target="a.filter.savingsTargetPercent"
      :loading="a.loading.value"
      @filtrar="a.fetchAnaliticas()"
    />

    <ReportesAnaliticasCashflowChart
      :data="a.cashflow.value"
      :currency="currency"
      :loading="a.loading.value"
    />

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <ReportesAnaliticasLeakageTable
        :data="a.leakage.value"
        :currency="currency"
        :loading="a.loading.value"
        class="lg:col-span-3"
      />
      <ReportesAnaliticasAlertsList
        :data="a.alerts.value"
        :currency="currency"
        :loading="a.loading.value"
        class="lg:col-span-2"
      />
    </div>
  </div>
</template>
