<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display font-semibold">
            Variación Neta
          </h2>
          <p class="text-sm text-neutral-400">
            Impacto mensual por rubro y balance
          </p>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="flex items-center gap-1 text-emerald-300"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Aumento</span>
          <span class="flex items-center gap-1 text-rose-300"><span class="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> Disminución</span>
        </div>
      </div>
    </template>

    <div v-if="bars.length <= 1" class="py-8">
      <UEmpty icon="i-lucide-chart-candlestick" title="Sin flujo en el periodo" description="No hay movimientos para construir la cascada." />
    </div>

    <div v-else class="h-48 flex items-center justify-between gap-1.5 pt-3 pb-2 px-1 relative">
      <div class="absolute left-0 right-0 border-b border-dashed border-white/10" :style="{ bottom: `${zeroLine}%` }" />
      <div v-for="bar in bars" :key="bar.key" class="flex-1 flex flex-col items-center h-full justify-end z-10 min-w-0">
        <span class="text-[11px] tabular-nums" :class="bar.positive ? 'text-emerald-300' : 'text-rose-300'">
          {{ formatCompactSigned(bar.amount) }}
        </span>
        <div
          class="w-3.5 rounded mt-1"
          :class="bar.cls"
          :style="{ height: `${bar.height}%` }"
          :title="`${bar.label}: ${formatMoney(bar.amount, currency)}`"
        />
        <span class="text-[11px] text-neutral-400 mt-1 truncate w-full text-center" :class="{ 'font-bold text-blue-300': bar.isTotal }">
          {{ bar.label }}
        </span>
      </div>
    </div>

    <div v-if="bars.length > 1" class="pt-3 border-t border-white/5 flex items-center justify-between text-sm">
      <span class="text-neutral-400">Cierre del periodo</span>
      <span class="font-semibold tabular-nums" :class="closing >= 0 ? 'text-emerald-300' : 'text-rose-300'">
        {{ formatMoney(closing, currency) }}
      </span>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { WaterfallStep } from '~/types/dashboard'
import { formatCompact, formatMoney } from '~/utils/format'

const props = defineProps<{
  steps: WaterfallStep[]
  currency: string
}>()

const bars = computed(() => {
  const all = props.steps.flatMap(s => [s.start, s.end])
  const min = Math.min(0, ...all)
  const max = Math.max(0, ...all)
  const range = max - min || 1
  return props.steps.map((s, i) => {
    const lo = Math.min(s.start, s.end)
    const height = Math.max(3, (Math.abs(s.end - s.start) / range) * 100)
    const isTotal = s.type === 'total'
    return {
      key: `${s.label}-${i}`,
      label: s.label,
      amount: s.amount,
      positive: s.amount >= 0,
      isTotal,
      height,
      bottom: ((lo - min) / range) * 100,
      cls: isTotal
        ? 'bg-rose-400/30 border border-rose-400'
        : s.amount >= 0
          ? 'bg-emerald-400'
          : 'bg-rose-400/80',
    }
  })
})

/** Altura de la línea cero respecto al contenedor. */
const zeroLine = computed(() => {
  const all = props.steps.flatMap(s => [s.start, s.end])
  const min = Math.min(0, ...all)
  const max = Math.max(0, ...all)
  return (((0 - min) / ((max - min) || 1)) * 100) + 8
})

const closing = computed(() => {
  const total = props.steps.find(s => s.type === 'total')
  return total ? total.amount : (props.steps[props.steps.length - 1]?.end ?? 0)
})

function formatCompactSigned(value: number): string {
  const abs = formatCompact(Math.abs(value), props.currency)
  if (value > 0) return `+${abs}`
  if (value < 0) return `−${abs}`
  return abs
}
</script>
