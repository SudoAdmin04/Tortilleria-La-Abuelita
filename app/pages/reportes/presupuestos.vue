<script setup lang="ts">
import { formatCompact, formatExecution, formatMoney } from '~/utils/format'

useHead({ title: 'Presupuesto' })

const auth = useAuthStore()
const currency = computed(() => auth.user?.currency || 'MXN')

const p = useResumenPresupuesto()

const stats = computed(() => {
  const t = p.totals.value
  const c = p.counts.value
  const sobregiro = t.remaining < 0
  return [
    {
      label: 'Planeado',
      value: formatMoney(t.planned, currency.value),
      sub: `${c.all} rubros en el mes`,
      icon: 'i-lucide-target',
      tone: 'neutral' as const,
    },
    {
      label: 'Ejecutado',
      value: formatMoney(t.executed, currency.value),
      sub: `Ejecución ${formatExecution(t.executionRate)}`,
      icon: 'i-lucide-receipt',
      tone: 'primary' as const,
      progress: t.executionRate,
    },
    {
      label: 'Restante',
      value: formatMoney(t.remaining, currency.value),
      sub: sobregiro ? 'Sobregiro del mes' : `Disponible ${formatCompact(t.remaining, currency.value)}`,
      icon: 'i-lucide-wallet',
      tone: (sobregiro ? 'danger' : 'success') as const,
    },
    {
      label: 'Excedidos',
      value: `${c.exceeded}`,
      sub: `En orden ${c.within} · cerca ${c.near}`,
      icon: 'i-lucide-triangle-alert',
      tone: (c.exceeded > 0 ? 'warning' : 'success') as const,
    },
  ]
})

onMounted(() => p.fetchResumen())
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Presupuesto"
      description="Planeado vs ejecutado por rubro y partida"
      icon="i-lucide-wallet"
      :hide-search="true"
    >
      <template #actions>
        <UButton to="/reportes" color="neutral" variant="outline" size="sm" icon="i-lucide-layout-dashboard">
          Resumen
        </UButton>
        <UButton to="/reportes/analiticas" color="neutral" variant="outline" size="sm" icon="i-lucide-chart-no-axes-combined">
          Analíticas
        </UButton>
        <UButton to="/reportes/presupuesto" color="primary" variant="solid" size="sm" icon="i-lucide-wallet">
          Presupuesto
        </UButton>
      </template>
    </AppToolbar>

    <UAlert
      v-if="p.error.value && !p.data.value"
      color="error"
      variant="subtle"
      title="No se pudo cargar el presupuesto"
      :description="p.error.value"
    />

    <AppStatCards :stats="stats" :loading="p.loading.value && !p.data.value" :columns="4" />

    <ReportesPresupuestoFilters
      v-model:year="p.filter.year"
      v-model:month="p.filter.month"
      :loading="p.loading.value"
      @filtrar="p.fetchResumen()"
    />

    <ReportesPresupuestoRubrosTable
      :data="p.rubros.value"
      :currency="currency"
      :loading="p.loading.value"
    />
  </div>
</template>
