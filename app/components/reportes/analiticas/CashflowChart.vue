<script setup lang="ts">
import type { AnalyticsCashflowPoint } from '~/services/reports.service'
import { formatCompact, formatMoney, num } from '~/utils/format'

const props = withDefaults(defineProps<{
  data?: AnalyticsCashflowPoint[]
  currency?: string
  loading?: boolean
}>(), {
  data: () => [],
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')

const shortLabel = (period: string) => {
  const [y, m] = period.split('-').map(Number)
  if (!y || !m) return period
  const name = new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(new Date(y, m - 1, 1)).replace('.', '')
  return `${name} ${String(y).slice(2)}`
}

const bars = computed(() => {
  const all = props.data.flatMap(p => [num(p.income), num(p.expense), num(p.budgetExpense)])
  const max = Math.max(1, ...all)
  return props.data.map((p, i) => {
    const income = num(p.income)
    const expense = num(p.expense)
    const net = num(p.net)
    return {
      key: `${p.period}-${i}`,
      label: shortLabel(p.period),
      income,
      expense,
      net,
      positive: net >= 0,
      incomeH: Math.max(3, (income / max) * 100),
      expenseH: Math.max(3, (expense / max) * 100),
    }
  })
})
</script>

<template>
  <UCard class="border border-white/10 hover:border-white/15">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div>
          <h2 class="font-display font-semibold">
            Flujo mensual
          </h2>
          <p class="text-sm text-neutral-400">
            Ingresos vs egresos por periodo
          </p>
        </div>
        <div class="flex items-center gap-3 text-xs shrink-0">
          <span class="flex items-center gap-1 text-primary-300"><span class="w-2.5 h-2.5 rounded-sm bg-primary-500 inline-block" /> Ingresos</span>
          <span class="flex items-center gap-1 text-red-300"><span class="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Egresos</span>
        </div>
      </div>
    </template>

    <div v-if="loading && bars.length === 0" class="h-56 flex items-end justify-around gap-2 pt-3 pb-2 px-1 animate-pulse">
      <div v-for="n in 6" :key="n" class="flex gap-1 items-end h-full">
        <div class="w-3.5 rounded bg-white/10 h-2/3" />
        <div class="w-3.5 rounded bg-white/10 h-1/2" />
      </div>
    </div>

    <div v-else-if="bars.length === 0" class="py-8">
      <UEmpty icon="i-lucide-chart-column" title="Sin flujo en el periodo" description="No hay movimientos para construir el cashflow." />
    </div>

    <div v-else class="h-56 flex items-stretch justify-between gap-1.5 pt-3 pb-2 px-1">
      <div v-for="bar in bars" :key="bar.key" class="flex-1 flex flex-col items-center min-w-0">
        <span class="text-[11px] tabular-nums truncate" :class="bar.positive ? 'text-green-300' : 'text-rose-300'">
          {{ bar.positive ? '+' : '−' }}{{ formatCompact(Math.abs(bar.net), moneda) }}
        </span>
        <div class="flex-1 flex items-end justify-center gap-1 w-full min-h-0 mt-1">
          <div
            class="w-3.5 rounded bg-primary-500"
            :style="{ height: `${bar.incomeH}%` }"
            :title="`Ingresos: ${formatMoney(bar.income, moneda)}`"
          />
          <div
            class="w-3.5 rounded bg-red-500/80"
            :style="{ height: `${bar.expenseH}%` }"
            :title="`Egresos: ${formatMoney(bar.expense, moneda)}`"
          />
        </div>
        <span class="text-[11px] text-neutral-400 mt-1 truncate w-full text-center">{{ bar.label }}</span>
      </div>
    </div>
  </UCard>
</template>
