<script setup lang="ts">
import { getApiMessage } from '~/utils/api-error'
import { formatMoney } from '~/utils/format'

const auth = useAuthStore()
const dash = useDashboardData()

const currency = computed(() => auth.user?.currency || 'MXN')
const disponible = computed(() => dash.liquidity.value?.liquid ?? dash.liquidity.value?.total ?? 0)
const netLabel = computed(() => dash.kpis.value?.net.label ?? (dash.kpis.value?.net.isDeficit ? 'Déficit' : 'Superávit'))
const isDeficit = computed(() => dash.kpis.value?.net.isDeficit ?? false)

function matchesSearch(name: string): boolean {
  const q = dash.search.value.trim().toLowerCase()
  return q === '' || name.toLowerCase().includes(q)
}

const filteredIncome = computed(() => ({
  ...(dash.incomeSummary.value ?? null),
  rows: (dash.incomeSummary.value?.rows ?? []).filter(r => matchesSearch(r.name)),
}))

const filteredExpense = computed(() => ({
  ...(dash.expenseSummary.value ?? null),
  rows: (dash.expenseSummary.value?.rows ?? []).filter(r => matchesSearch(r.name)),
}))

const initialLoading = computed(() => dash.overviewPending.value && !dash.overview.value)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold tracking-tight">
          Resumen Financiero Ejecutivo
        </h1>
        <p class="text-sm text-muted mt-0.5">
          Control de liquidez mensual, ejecución presupuestaria y arqueo patrimonial · {{ dash.rangeLabel.value }}
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <UBadge color="neutral" variant="soft" size="lg">
          Disponible: {{ formatMoney(disponible, currency) }}
        </UBadge>
        <UBadge :color="isDeficit ? 'error' : 'success'" variant="soft" size="lg">
          {{ netLabel }}: {{ formatMoney(dash.kpis.value?.net.net, currency) }}
        </UBadge>
      </div>
    </div>

    <DashboardFilters
      v-model:granularity="dash.granularity.value"
      v-model:account-id="dash.accountId.value"
      v-model:payment-method="dash.paymentMethod.value"
      v-model:search="dash.search.value"
      :cuentas="dash.accountOptions.value.slice(1)"
      :period-label="dash.rangeLabel.value"
      @limpiar="dash.limpiarFiltros()"
      @prev-period="dash.prevMonth()"
      @next-period="dash.nextMonth()"
      @go-current="dash.goCurrent()"
    />

    <UAlert
      v-if="dash.overviewError.value"
      color="error"
      variant="soft"
      title="No se pudo cargar el dashboard"
      :description="getApiMessage(dash.overviewError.value)"
    >
      <template #actions>
        <UButton color="error" variant="solid" @click="dash.refreshOverview()">
          Reintentar
        </UButton>
      </template>
    </UAlert>

    <div v-else-if="initialLoading" class="flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <USkeleton v-for="i in 4" :key="i" class="h-44" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <USkeleton class="h-96 lg:col-span-4" />
        <USkeleton class="h-96 lg:col-span-4" />
        <USkeleton class="h-96 lg:col-span-4" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <USkeleton class="h-72" />
        <USkeleton class="h-72" />
      </div>
    </div>

    <template v-else>
      <UEmpty
        v-if="!dash.hasRealMovements.value"
        icon="i-lucide-wallet"
        :title="`Sin movimientos en ${dash.rangeLabel.value}`"
        description="Registra tu primer movimiento o cambia de periodo para ver el resumen ejecutivo."
      />

      <DashboardKpiCards
        :kpis="dash.kpis.value"
        :currency="currency"
        :loading="dash.overviewPending.value"
      />

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <DashboardExpenseDonut
          :data="dash.expenseDistribution.value"
          :currency="currency"
          :loading="dash.overviewPending.value"
          class="lg:col-span-4"
        />
        <DashboardIncomeBudgetBars
          :data="dash.incomeVsBudget.value"
          :currency="currency"
          :loading="dash.overviewPending.value"
          class="lg:col-span-4"
        />
        <DashboardWaterfallCard
          :data="dash.waterfall.value"
          :currency="currency"
          :loading="dash.overviewPending.value"
          class="lg:col-span-4"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardLedgerTable
          title="Resumen Ingresos"
          icon="i-lucide-circle-arrow-down"
          mode="income"
          :summary="filteredIncome"
          :currency="currency"
          :loading="dash.overviewPending.value"
        />
        <DashboardLedgerTable
          title="Resumen Egresos"
          icon="i-lucide-circle-arrow-up"
          mode="expense"
          :summary="filteredExpense"
          :currency="currency"
          :loading="dash.overviewPending.value"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardCategoryBreakdownCard
          :data="dash.breakdown.value"
          :currency="currency"
          :loading="dash.breakdownPending.value"
        />
        <DashboardDebtsSnapshotCard
          :data="dash.debts.value"
          :currency="currency"
          :loading="dash.debtsPending.value"
        />
        <DashboardSavingsSnapshotCard
          :data="dash.savings.value"
          :currency="currency"
          :loading="dash.savingsPending.value"
        />
      </div>
    </template>
  </div>
</template>
