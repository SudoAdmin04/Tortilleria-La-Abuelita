<script setup lang="ts">
import { formatCompact, formatExecution, formatMoney } from '~/utils/format'

useHead({ title: 'Reportes' })

const auth = useAuthStore()
const currency = computed(() => auth.user?.currency || 'MXN')

const r = useReportes()

const stats = computed(() => {
  const t = r.totals.value
  return [
    {
      label: 'Ingresos',
      value: formatMoney(t.income, currency.value),
      sub: `Ppto ${formatCompact(t.incomeBudget, currency.value)} · ${formatExecution(t.incomeExecutionRate)}`,
      icon: 'i-lucide-arrow-down-to-line',
      tone: 'success' as const,
    },
    {
      label: 'Egresos',
      value: formatMoney(t.expense, currency.value),
      sub: `Ppto ${formatCompact(t.expenseBudget, currency.value)} · ${formatExecution(t.expenseExecutionRate)}`,
      icon: 'i-lucide-arrow-up-from-line',
      tone: (t.expenseVariance > 0 ? 'danger' : 'neutral') as const,
    },
    {
      label: 'Saldo neto',
      value: formatMoney(t.net, currency.value),
      sub: t.isDeficit ? 'Déficit del mes' : 'Superávit del mes',
      icon: 'i-lucide-scale',
      tone: (t.isDeficit ? 'danger' : 'primary') as const,
    },
    {
      label: 'Patrimonio neto',
      value: formatMoney(r.netWorth.value, currency.value),
      sub: `Por pagar ${formatCompact(r.liabilities.value.payable, currency.value)} · por cobrar ${formatCompact(r.liabilities.value.receivable, currency.value)}`,
      icon: 'i-lucide-landmark',
      tone: 'neutral' as const,
    },
  ]
})

onMounted(() => r.fetchReportes())
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Reportes"
      description="Resumen ejecutivo del mes"
      icon="i-lucide-layout-dashboard"
      :hide-search="true"
    >
      <template #actions>
        <UButton to="/reportes" color="primary" variant="solid" size="sm" icon="i-lucide-layout-dashboard">
          Resumen
        </UButton>
        <UButton to="/reportes/analiticas" color="neutral" variant="outline" size="sm" icon="i-lucide-chart-no-axes-combined">
          Analíticas
        </UButton>
        <UButton to="/reportes/presupuesto" color="neutral" variant="outline" size="sm" icon="i-lucide-wallet">
          Presupuesto
        </UButton>
      </template>
    </AppToolbar>

    <UAlert
      v-if="r.error.value && !r.data.value"
      color="error"
      variant="subtle"
      title="No se pudo cargar el resumen"
      :description="r.error.value"
    />

    <AppStatCards :stats="stats" :loading="r.loading.value && !r.data.value" :columns="4" />

    <ReportesDashboardFilters
      v-model:year="r.filter.year"
      v-model:month="r.filter.month"
      :loading="r.loading.value"
      @filtrar="r.fetchReportes()"
    />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReportesDashboardDistributionChart
        :data="r.distribution.value"
        :currency="currency"
        :loading="r.loading.value"
      />
      <ReportesDashboardWaterfallChart
        :data="r.waterfall.value"
        :currency="currency"
        :loading="r.loading.value"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReportesDashboardRubrosTable
        title="Ingresos por rubro"
        subtitle="Real vs presupuesto del mes"
        kind="income"
        :data="r.incomeRubros.value"
        :currency="currency"
        :loading="r.loading.value"
      />
      <ReportesDashboardRubrosTable
        title="Egresos por rubro"
        subtitle="Real vs presupuesto del mes"
        kind="expense"
        :data="r.expenseRubros.value"
        :currency="currency"
        :loading="r.loading.value"
      />
    </div>
  </div>
</template>
