<script setup lang="ts">
import type { Kpis } from '~/services/dashboard.service'
import { formatExecution, formatMoney, formatVariance, num } from '~/utils/format'

const props = withDefaults(defineProps<{
  kpis?: Kpis | null
  currency?: string
  loading?: boolean
}>(), {
  kpis: null,
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')

const net = computed(() => props.kpis?.net ?? null)
const income = computed(() => props.kpis?.income ?? null)
const expense = computed(() => props.kpis?.expense ?? null)
const liquidity = computed(() => props.kpis?.liquidity ?? null)

const isDeficit = computed(() => net.value?.isDeficit ?? false)
const incomePct = computed(() => Math.min(100, Math.max(0, num(income.value?.executionRate))))
const expensePct = computed(() => Math.min(100, Math.max(0, num(expense.value?.executionRate))))
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <template v-if="loading && !kpis">
      <UCard v-for="n in 4" :key="n" class="border border-default">
        <div class="flex flex-col gap-3 animate-pulse">
          <div class="flex items-center justify-between">
            <div class="h-3 w-28 rounded bg-elevated" />
            <div class="h-5 w-16 rounded-full bg-elevated" />
          </div>
          <div class="h-9 w-2/3 rounded bg-elevated" />
          <div class="h-3 w-1/2 rounded bg-elevated" />
        </div>
      </UCard>
    </template>

    <template v-else>
      <UCard class="border border-default hover:border-accented">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-muted uppercase tracking-wider">Saldo Neto del Mes</span>
          <UBadge :color="isDeficit ? 'error' : 'success'" variant="soft">
            {{ net?.label ?? (isDeficit ? 'Déficit' : 'Superávit') }}
          </UBadge>
        </div>
        <p class="my-2 text-4xl font-display font-bold tracking-tight tabular-nums" :class="isDeficit ? 'text-rose-600 dark:text-rose-300' : 'text-green-600 dark:text-green-300'">
          {{ formatMoney(net?.net, moneda) }}
        </p>
        <div class="pt-2 border-t border-muted flex items-center justify-between text-sm gap-2">
          <span class="text-muted shrink-0">Saldo Calculado</span>
          <span class="font-small tabular-nums truncate">{{ net?.detail ?? `${formatMoney(net?.income, moneda)} − ${formatMoney(net?.expense, moneda)}` }}</span>
        </div>
      </UCard>

      <UCard class="border border-default hover:border-accented">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-muted uppercase tracking-wider">Ingresos Totales</span>
          <UBadge color="success" variant="soft">
            {{ income?.badge ?? `${formatExecution(income?.executionRate)} meta` }}
          </UBadge>
        </div>
        <p class="my-2 text-4xl font-display font-bold tracking-tight tabular-nums">
          {{ formatMoney(income?.total, moneda) }}
        </p>
        <p class="text-sm text-muted">
          Ppto: <strong class="text-default tabular-nums">{{ formatMoney(income?.budget, moneda) }}</strong>
          <span class="mx-1">•</span>
          Dif: <strong class="tabular-nums" :class="num(income?.variance) >= 0 ? 'text-green-600 dark:text-green-300' : 'text-rose-600 dark:text-rose-300'">{{ formatVariance(income?.variance, moneda) }}</strong>
        </p>
        <UProgress :model-value="incomePct" :max="100" color="success" class="mt-3" />
      </UCard>

      <UCard class="border border-default hover:border-accented">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-muted uppercase tracking-wider">Egresos Totales</span>
          <UBadge :color="num(expense?.variance) > 0 ? 'error' : 'success'" variant="soft">
            {{ expense?.badge ?? `${formatVariance(expense?.variance, moneda)} vs ppto` }}
          </UBadge>
        </div>
        <p class="my-2 text-4xl font-display font-bold tracking-tight tabular-nums">
          {{ formatMoney(expense?.total, moneda) }}
        </p>
        <p class="text-sm text-muted">
          Ppto: <strong class="text-default tabular-nums">{{ formatMoney(expense?.budget, moneda) }}</strong>
          <span class="mx-1">•</span>
          Ejecución: <strong class="tabular-nums">{{ formatExecution(expense?.executionRate) }}</strong>
        </p>
        <UProgress :model-value="expensePct" :max="100" color="error" class="mt-3" />
      </UCard>

      <UCard class="border border-default hover:border-accented">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-muted uppercase tracking-wider">Disponibilidad en Cuentas</span>
          <UIcon name="i-lucide-wallet" class="size-4 text-muted" />
        </div>
        <div class="my-2 space-y-1.5">
          <div v-for="account in (liquidity?.items ?? []).slice(0, 3)" :key="account.id" class="flex items-center justify-between text-sm gap-2">
            <span class="flex items-center gap-1.5 text-toned truncate min-w-0">
              <span class="w-2 h-2 rounded-full shrink-0" :class="account.isPrimary ? 'bg-blue-400' : 'bg-neutral-500'" />
              <span class="truncate">{{ account.name }}{{ account.isPrimary ? ' (Principal)' : '' }}</span>
            </span>
            <span class="tabular-nums font-semibold shrink-0 text-muted">{{ formatMoney(account.balance, moneda) }}</span>
          </div>
          <p v-if="(liquidity?.items ?? []).length === 0" class="text-sm text-muted">
            Sin cuentas registradas.
          </p>
        </div>
        <div class="pt-2 border-t border-muted flex items-center justify-between text-sm text-muted">
          <span>Total Disponible</span>
          <span class="tabular-nums text-highlighted font-bold">{{ formatMoney(liquidity?.liquid ?? liquidity?.total, moneda) }}</span>
        </div>
      </UCard>
    </template>
  </div>
</template>
