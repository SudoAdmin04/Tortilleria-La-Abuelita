<script setup lang="ts">
import type { TransactionSummary } from '~/services/transactions.service'
import { formatMoney, formatExecution, formatVariance } from '~/utils/format'

const props = withDefaults(defineProps<{
  summary?: TransactionSummary | null
  currency?: string
  loading?: boolean
}>(), {
  summary: null,
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')
const incomeTotal = computed(() => props.summary?.income.total ?? 0)
const incomeCount = computed(() => props.summary?.income.count ?? 0)
const incomeBudget = computed(() => props.summary?.income.budget ?? 0)
const incomeVariance = computed(() => props.summary?.income.variance ?? 0)
const incomeRate = computed(() => props.summary?.income.executionRate ?? null)
const expenseTotal = computed(() => props.summary?.expense.total ?? 0)
const expenseCount = computed(() => props.summary?.expense.count ?? 0)
const expenseBudget = computed(() => props.summary?.expense.budget ?? 0)
const expenseVariance = computed(() => props.summary?.expense.variance ?? 0)
const expenseRate = computed(() => props.summary?.expense.executionRate ?? null)
const netTotal = computed(() => props.summary?.net.total ?? 0)
const isDeficit = computed(() => props.summary?.net.isDeficit ?? netTotal.value < 0)
const pendingTotal = computed(() => props.summary?.pending.total ?? 0)
const pendingCount = computed(() => props.summary?.pending.count ?? 0)
const totalCount = computed(() => props.summary?.totalCount ?? 0)
const periodLabel = computed(() => props.summary?.period.label ?? '')
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    <template v-if="loading">
      <UCard v-for="n in 4" :key="n" class="border border-white/10" :ui="{ body: 'p-5' }">
        <div class="flex flex-col gap-3 animate-pulse">
          <div class="flex items-center justify-between">
            <div class="h-3 w-28 rounded bg-white/10" />
            <div class="size-8 rounded-lg bg-white/10" />
          </div>
          <div class="h-8 w-2/3 rounded bg-white/10" />
          <div class="h-3 w-1/2 rounded bg-white/10" />
        </div>
      </UCard>
    </template>

    <template v-else>
      <UCard
        class="border border-white/10 transition-colors duration-200 hover:border-emerald-500/30"
        :ui="{ body: 'p-5 flex flex-col gap-2' }"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-[11px] font-semibold uppercase tracking-widest text-white/45">
            Ingresos totales
          </span>
          <span class="flex items-center justify-center size-8 rounded-lg shrink-0 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <UIcon name="i-lucide-arrow-down" class="size-4" />
          </span>
        </div>
        <div class="flex items-baseline gap-2 flex-wrap">
          <span class="text-[28px] leading-none font-bold tracking-tight text-white tabular-nums">
            {{ formatMoney(incomeTotal, moneda) }}
          </span>
          <UBadge color="success" variant="subtle" size="sm" class="font-semibold">
            {{ incomeCount }} mov.
          </UBadge>
        </div>
        <div class="flex items-center justify-between text-xs pt-2 border-t border-white/5">
          <span class="text-white/40 truncate">
            {{ totalCount }} registro{{ totalCount === 1 ? '' : 's' }}{{ periodLabel ? ` · ${periodLabel}` : '' }}
          </span>
          <span class="font-semibold text-emerald-300/90 tabular-nums shrink-0">
            {{ incomeBudget > 0 ? `Ppto ${formatMoney(incomeBudget, moneda)}` : `+${formatMoney(incomeTotal, moneda)}` }}
          </span>
        </div>
        <div v-if="incomeBudget > 0" class="flex items-center justify-between text-xs">
          <span class="text-white/40 truncate">
            Ejecución {{ formatExecution(incomeRate) }}
          </span>
          <span class="font-semibold tabular-nums shrink-0" :class="incomeVariance <= 0 ? 'text-emerald-300/90' : 'text-amber-300/90'">
            Dif {{ formatVariance(incomeVariance, moneda) }}
          </span>
        </div>
      </UCard>

      <UCard
        class="border border-white/10 transition-colors duration-200 hover:border-red-500/30"
        :ui="{ body: 'p-5 flex flex-col gap-2' }"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-[11px] font-semibold uppercase tracking-widest text-white/45">
            Egresos totales
          </span>
          <span class="flex items-center justify-center size-8 rounded-lg shrink-0 bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
            <UIcon name="i-lucide-arrow-up" class="size-4" />
          </span>
        </div>
        <div class="flex items-baseline gap-2 flex-wrap">
          <span class="text-[28px] leading-none font-bold tracking-tight text-white tabular-nums">
            {{ formatMoney(expenseTotal, moneda) }}
          </span>
          <UBadge color="error" variant="subtle" size="sm" class="font-semibold">
            {{ expenseCount }} mov.
          </UBadge>
        </div>
        <div class="flex items-center justify-between text-xs pt-2 border-t border-white/5">
          <span class="text-white/40 truncate">
            {{ expenseBudget > 0 ? `Ppto ${formatMoney(expenseBudget, moneda)}` : 'Gasto en vista actual' }}
          </span>
          <span class="font-semibold text-red-300/90 tabular-nums shrink-0">
            −{{ formatMoney(expenseTotal, moneda) }}
          </span>
        </div>
        <div v-if="expenseBudget > 0" class="flex items-center justify-between text-xs">
          <span class="text-white/40 truncate">
            Ejecución {{ formatExecution(expenseRate) }}
          </span>
          <span class="font-semibold tabular-nums shrink-0" :class="expenseVariance <= 0 ? 'text-emerald-300/90' : 'text-red-300/90'">
            Dif {{ formatVariance(expenseVariance, moneda) }}
          </span>
        </div>
      </UCard>

      <UCard
        class="border border-white/10 transition-colors duration-200"
        :class="isDeficit ? 'hover:border-red-500/30' : 'hover:border-emerald-500/30'"
        :ui="{ body: 'p-5 flex flex-col gap-2' }"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-[11px] font-semibold uppercase tracking-widest text-white/45">
            Saldo neto filtrado
          </span>
          <span
            class="flex items-center justify-center size-8 rounded-lg shrink-0 ring-1"
            :class="isDeficit ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'"
          >
            <UIcon :name="isDeficit ? 'i-lucide-trending-down' : 'i-lucide-trending-up'" class="size-4" />
          </span>
        </div>
        <div class="flex items-baseline gap-2 flex-wrap">
          <span
            class="text-[28px] leading-none font-bold tracking-tight tabular-nums"
            :class="isDeficit ? 'text-red-300' : 'text-emerald-300'"
          >
            {{ formatMoney(netTotal, moneda) }}
          </span>
          <UBadge :color="isDeficit ? 'error' : 'success'" variant="subtle" size="sm" class="font-semibold">
            {{ isDeficit ? 'Déficit' : 'Superávit' }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between text-xs pt-2 border-t border-white/5">
          <span class="text-white/40 truncate">
            Ingresos − egresos
          </span>
          <span class="text-white/50 tabular-nums shrink-0">
            {{ incomeCount }} vs {{ expenseCount }}
          </span>
        </div>
      </UCard>

      <UCard
        class="border border-white/10 transition-colors duration-200 hover:border-amber-500/30"
        :ui="{ body: 'p-5 flex flex-col gap-2' }"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-[11px] font-semibold uppercase tracking-widest text-white/45">
            Por conciliar
          </span>
          <span class="flex items-center justify-center size-8 rounded-lg shrink-0 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
            <UIcon name="i-lucide-file-clock" class="size-4" />
          </span>
        </div>
        <div class="flex items-baseline gap-2 flex-wrap">
          <span class="text-[28px] leading-none font-bold tracking-tight text-white tabular-nums">
            {{ formatMoney(pendingTotal, moneda) }}
          </span>
          <UBadge color="warning" variant="subtle" size="sm" class="font-semibold">
            {{ pendingCount }} pendiente{{ pendingCount === 1 ? '' : 's' }}
          </UBadge>
        </div>
        <div class="flex items-center justify-between text-xs pt-2 border-t border-white/5">
          <span class="text-white/40 truncate">
            Requieren conciliación{{ periodLabel ? ` · ${periodLabel}` : '' }}
          </span>
          <span class="font-medium text-amber-300/90 shrink-0">
            Ver detalle ↓
          </span>
        </div>
      </UCard>
    </template>
  </div>
</template>
