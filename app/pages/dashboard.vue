<template>
  <div class="flex flex-col gap-6">
    <!-- Encabezado -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold tracking-tight">
          Resumen Financiero Ejecutivo
        </h1>
        <p class="text-sm text-slate-400 mt-0.5">
          Liquidez mensual, ejecución presupuestaria y patrimonio · {{ dash.periodLabel }}
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <UBadge color="neutral" variant="soft" size="lg">
          Patrimonio: {{ formatMoney(dash.netWorth.value, currency) }}
        </UBadge>
        <UBadge v-if="dash.pendingTransactions.value > 0" color="warning" variant="soft" size="lg">
          {{ dash.pendingTransactions.value }} por conciliar
        </UBadge>
      </div>
    </div>

    <!-- Error -->
    <UAlert
      v-if="dash.error.value"
      color="error"
      variant="soft"
      title="No se pudo cargar el dashboard"
      :description="getApiMessage(dash.error.value)"
    >
      <template #actions>
        <UButton color="error" variant="solid" @click="dash.refresh()">
          Reintentar
        </UButton>
      </template>
    </UAlert>

    <!-- Carga inicial -->
    <div v-else-if="dash.pending.value && !dash.data.value" class="flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <USkeleton v-for="i in 4" :key="i" class="h-44" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <USkeleton class="h-96 lg:col-span-4" />
        <USkeleton class="h-96 lg:col-span-4" />
        <USkeleton class="h-96 lg:col-span-4" />
      </div>
    </div>

    <!-- Contenido -->
    <template v-else>
      <UEmpty
        v-if="!dash.hasMovements.value"
        icon="i-lucide-wallet"
        title="Sin movimientos en {{ dash.periodLabel }}"
        description="Registra tu primer movimiento o cambia de mes para ver el resumen ejecutivo."
      />

      <DashboardKpiCards :totals="dash.totals.value" :accounts="scopedAccounts" :currency="currency" />

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <DashboardExpenseDonut
          :distribution="dash.distribution.value"
          :total="dash.totals.value.expense"
          :currency="currency"
          class="lg:col-span-4"
        />
        <DashboardIncomeBudgetBars
          :rubros="dash.incomeRubros.value"
          :currency="currency"
          class="lg:col-span-4"
        />
        <DashboardWaterfallCard
          :steps="dash.steps.value"
          :currency="currency"
          class="lg:col-span-4"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardLedgerTable
          title="Resumen Ingresos"
          icon="i-lucide-circle-arrow-down"
          badge="Rubros de ingreso"
          mode="income"
          :rows="filteredIncome"
          total-label="Total Ingresos"
          :total-budget="dash.totals.value.incomeBudget"
          :total-actual="dash.totals.value.income"
          :total-variance="dash.totals.value.incomeVariance"
          :currency="currency"
        />
        <DashboardLedgerTable
          title="Resumen Egresos"
          icon="i-lucide-circle-arrow-up"
          :badge="expenseBadge"
          mode="expense"
          :rows="filteredExpense"
          total-label="Total Egresos"
          :total-budget="dash.totals.value.expenseBudget"
          :total-actual="dash.totals.value.expense"
          :total-variance="dash.totals.value.expenseVariance"
          :currency="currency"
        />
      </div>

      <DashboardRubroSpotlight :rubros="dash.expenseRubros.value" :currency="currency" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { getApiMessage } from '~/utils/api-error'
import { formatMoney } from '~/utils/format'

const auth = useAuthStore()
const dash = useDashboardData()

const currency = computed(() => auth.user?.currency || 'MXN')

function matchesSearch(name: string): boolean {
  const q = dash.search.value.trim().toLowerCase()
  return q === '' || name.toLowerCase().includes(q)
}

const filteredIncome = computed(() => dash.incomeRubros.value.filter(r => matchesSearch(r.name)))
const filteredExpense = computed(() => dash.expenseRubros.value.filter(r => matchesSearch(r.name)))

const expenseBadge = computed(() => {
  const over = dash.expenseRubros.value.filter(r => r.status === 'exceeded' || r.status === 'unbudgeted').length
  return over > 0 ? `${over} rubro(s) con sobregiro` : 'Ejecución bajo control'
})

// Filtro global de cuenta del header: acota las tarjetas de cuentas
const scopedAccounts = computed(() => ({
  ...dash.accounts.value,
  items: dash.accountId.value
    ? dash.accounts.value.items.filter(a => a.id === dash.accountId.value)
    : dash.accounts.value.items,
}))
</script>
