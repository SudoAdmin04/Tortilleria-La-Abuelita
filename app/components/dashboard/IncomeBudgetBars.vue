
<script setup lang="ts">
import type { BudgetLine } from '~/types/dashboard'
import { formatCompact, formatExecution, formatMoney, num } from '~/utils/format'

const props = defineProps<{
  rubros: BudgetLine[]
  currency: string
}>()

const maxValue = computed(() => Math.max(1, ...props.rubros.flatMap(r => [num(r.budget), num(r.actual)])))

const bars = computed(() => props.rubros.map(r => ({
  key: r.categoryId,
  name: r.name,
  budget: num(r.budget),
  actual: num(r.actual),
  budgetPct: Math.max(2, (num(r.budget) / maxValue.value) * 100),
  actualPct: Math.max(2, (num(r.actual) / maxValue.value) * 100),
})))

const overallRate = computed(() => {
  const budget = props.rubros.reduce((acc, r) => acc + num(r.budget), 0)
  if (budget <= 0) return null
  return (props.rubros.reduce((acc, r) => acc + num(r.actual), 0) / budget) * 100
})
</script>


<template>
  <UCard >
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display font-semibold">
            Presupuesto vs Ingreso
          </h2>
          <p class="text-sm text-neutral-400">
            Comparativa de ejecución por rubro
          </p>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="flex items-center gap-1 text-neutral-400"><span class="w-2.5 h-2.5 rounded-sm bg-neutral-600 inline-block" /> Ppto</span>
          <span class="flex items-center gap-1 text-blue-300"><span class="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" /> Real</span>
        </div>
      </div>
    </template>

    <div v-if="rubros.length === 0" class="py-8">
      <UEmpty icon="i-lucide-chart-column" title="Sin rubros de ingreso" description="No hay ejecución de ingresos en el periodo." />
    </div>

    <div v-else class="h-48 flex items-end justify-between gap-4 pt-4 pb-2 px-2 border-b border-white/5">
      <div v-for="bar in bars" :key="bar.key" class="flex-1 flex flex-col items-center h-full justify-end min-w-0">
        <div class="w-full flex items-end justify-center gap-1.5 h-full">
          <div class="w-4 bg-neutral-600 rounded-t" :style="{ height: `${bar.budgetPct}%` }" :title="`Ppto: ${formatMoney(bar.budget, currency)}`" />
          <div class="w-4 bg-blue-400 rounded-t" :style="{ height: `${bar.actualPct}%` }" :title="`Real: ${formatMoney(bar.actual, currency)}`" />
        </div>
        <span class="text-xs text-neutral-200 mt-2 truncate w-full text-center">{{ bar.name }}</span>
        <span class="text-xs text-neutral-400 tabular-nums">{{ formatCompact(bar.actual, currency) }}</span>
      </div>
    </div>

    <div v-if="rubros.length > 0" class="pt-3 flex items-center justify-between text-sm text-neutral-400">
      <span>Cumplimiento total</span>
      <span class="text-emerald-300 font-semibold tabular-nums">{{ formatExecution(overallRate) }}</span>
    </div>
  </UCard>
</template>
