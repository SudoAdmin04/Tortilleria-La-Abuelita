<script setup lang="ts">
import type { Waterfall } from '~/composables/useReportes'
import { formatCompact, formatMoney, num } from '~/utils/format'

const props = withDefaults(defineProps<{
  data?: Waterfall | null
  currency?: string
  loading?: boolean
}>(), {
  data: null,
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')
const steps = computed(() => props.data?.steps ?? [])

const bars = computed(() => {
  const all = steps.value.flatMap(s => [num(s.start), num(s.end)])
  const min = Math.min(0, ...all)
  const max = Math.max(0, ...all)
  const range = max - min || 1
  return steps.value.map((s, i) => {
    const height = Math.max(3, (Math.abs(num(s.end) - num(s.start)) / range) * 100)
    const isTotal = s.type === 'total'
    return {
      key: `${s.label}-${i}`,
      label: s.label,
      amount: num(s.amount),
      positive: num(s.amount) >= 0,
      isTotal,
      height,
      cls: isTotal
        ? 'bg-rose-400/30 border border-rose-400'
        : num(s.amount) >= 0
          ? 'bg-green-400'
          : 'bg-rose-400/80',
    }
  })
})

const closing = computed(() => {
  const total = steps.value.find(s => s.type === 'total')
  if (total) return num(total.amount)
  return num(steps.value[steps.value.length - 1]?.end)
})

function formatCompactSigned(value: number): string {
  const abs = formatCompact(Math.abs(value), moneda.value)
  if (value > 0) return `+${abs}`
  if (value < 0) return `−${abs}`
  return abs
}
</script>

<template>
  <UCard class="border border-default hover:border-accented">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div>
          <h2 class="font-display font-semibold">
            Cascada del mes
          </h2>
          <p class="text-sm text-muted">
            Ingresos suben, egresos bajan, cierre neto
          </p>
        </div>
        <div class="flex items-center gap-3 text-xs shrink-0">
          <span class="flex items-center gap-1 text-green-600 dark:text-green-400"><span class="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Aumento</span>
          <span class="flex items-center gap-1 text-red-600 dark:text-red-400"><span class="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Disminución</span>
        </div>
      </div>
    </template>

    <div v-if="loading && bars.length === 0" class="h-48 flex items-end justify-around gap-1.5 pt-3 pb-2 px-1 animate-pulse">
      <div v-for="n in 5" :key="n" class="w-3.5 rounded bg-elevated h-1/2" />
    </div>

    <div v-else-if="bars.length <= 1" class="py-8">
      <UEmpty icon="i-lucide-chart-candlestick" title="Sin flujo en el periodo" description="No hay movimientos para construir la cascada." />
    </div>

    <template v-else>
      <div class="h-48 flex items-center justify-between gap-1.5 pt-3 pb-2 px-1 relative">
        <div v-for="bar in bars" :key="bar.key" class="flex-1 flex flex-col items-center h-full justify-end z-10 min-w-0">
          <span class="text-[11px] tabular-nums" :class="bar.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ formatCompactSigned(bar.amount) }}
          </span>
          <div
            class="w-3.5 rounded mt-1"
            :class="bar.cls"
            :style="{ height: `${bar.height}%` }"
            :title="`${bar.label}: ${formatMoney(bar.amount, moneda)}`"
          />
          <span class="text-[11px] text-muted mt-1 truncate w-full text-center" :class="{ 'font-bold text-blue-600 dark:text-blue-300': bar.isTotal }">
            {{ bar.label }}
          </span>
        </div>
      </div>

      <div class="pt-3 border-t border-muted flex items-center justify-between text-sm gap-2">
        <span class="text-muted shrink-0">Saldo neto</span>
        <span class="font-semibold tabular-nums truncate" :class="closing >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
          {{ formatMoney(closing, moneda) }}
        </span>
      </div>
    </template>
  </UCard>
</template>
