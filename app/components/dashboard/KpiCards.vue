<script setup lang="ts">
import type { DashboardAccounts, DashboardTotals } from '~/types/dashboard'
import { formatExecution, formatMoney, formatVariance } from '~/utils/format'

const props = defineProps<{
  totals: DashboardTotals
  accounts: DashboardAccounts
  currency: string
}>()

const incomePct = computed(() => Math.min(100, Math.max(0, props.totals.incomeExecutionRate ?? 0)))
const expensePct = computed(() => Math.min(100, Math.max(0, props.totals.expenseExecutionRate ?? 0)))
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <UCard c>
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Saldo Neto del Mes</span>
        <UBadge :color="totals.isDeficit ? 'error' : 'success'" variant="soft">
          {{ totals.isDeficit ? 'Déficit' : 'Superávit' }}
        </UBadge>
      </div>
      <p class="my-2 text-4xl font-display font-bold tracking-tight" :class="totals.isDeficit ? 'text-rose-300' : 'text-emerald-300'">
        {{ formatMoney(totals.net, currency) }}
      </p>
      <div class="pt-2 border-t border-white/5 flex items-center justify-between text-sm">
        <span class="text-neutral-400">Ingresos − egresos</span>
        <span class="font-medium tabular-nums">{{ formatMoney(totals.income, currency) }} − {{ formatMoney(totals.expense, currency) }}</span>
      </div>
    </UCard>

    <UCard >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Ingresos Totales</span>
        <UBadge color="success" variant="soft">
          {{ formatExecution(totals.incomeExecutionRate) }} meta
        </UBadge>
      </div>
      <p class="my-2 text-4xl font-display font-bold tracking-tight text-emerald-300">
        {{ formatMoney(totals.income, currency) }}
      </p>
      <p class="text-sm text-neutral-400">
        Ppto: <strong class="text-neutral-100 tabular-nums">{{ formatMoney(totals.incomeBudget, currency) }}</strong>
        <span class="mx-1">•</span>
        Dif: <strong class="tabular-nums" :class="totals.incomeVariance >= 0 ? 'text-emerald-300' : 'text-rose-300'">{{ formatVariance(totals.incomeVariance, currency) }}</strong>
      </p>
      <UProgress :value="incomePct" :max="100" color="success" class="mt-3" />
    </UCard>

    <!-- Egresos -->
    <UCard >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Egresos Totales</span>
        <UBadge :color="totals.expenseVariance > 0 ? 'error' : 'success'" variant="soft">
          {{ formatVariance(totals.expenseVariance, currency) }} vs ppto
        </UBadge>
      </div>
      <p class="my-2 text-4xl font-display font-bold tracking-tight text-neutral-100">
        {{ formatMoney(totals.expense, currency) }}
      </p>
      <p class="text-sm text-neutral-400">
        Ppto: <strong class="text-neutral-100 tabular-nums">{{ formatMoney(totals.expenseBudget, currency) }}</strong>
        <span class="mx-1">•</span>
        Ejecución: <strong class="tabular-nums">{{ formatExecution(totals.expenseExecutionRate) }}</strong>
      </p>
      <UProgress :value="expensePct" :max="100" color="error" class="mt-3" />
    </UCard>

    <!-- Liquidez -->
    <UCard >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Disponibilidad</span>
        <UIcon name="i-lucide-wallet" class="size-4 text-neutral-400" />
      </div>
      <div class="my-2 space-y-1.5">
        <div v-for="account in accounts.items.slice(0, 3)" :key="account.id" class="flex items-center justify-between text-sm">
          <span class="flex items-center gap-1.5 text-neutral-200 truncate">
            <span class="w-2 h-2 rounded-full shrink-0" :class="account.isPrimary ? 'bg-blue-400' : 'bg-neutral-500'" />
            <span class="truncate">{{ account.name }}</span>
          </span>
          <span class="tabular-nums font-semibold">{{ formatMoney(account.balance, currency) }}</span>
        </div>
        <p v-if="accounts.items.length === 0" class="text-sm text-neutral-400">
          Sin cuentas registradas.
        </p>
      </div>
      <div class="pt-2 border-t border-white/5 flex items-center justify-between text-sm text-neutral-400">
        <span>Liquidez total</span>
        <span class="tabular-nums text-blue-300 font-bold">{{ formatMoney(accounts.total, currency) }}</span>
      </div>
    </UCard>
  </div>
</template>


