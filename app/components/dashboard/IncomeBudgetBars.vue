<script setup lang="ts">
import type { IncomeVsBudget } from '~/services/dashboard.service'
import { formatCompact, formatExecution, formatMoney, num } from '~/utils/format'

const props = withDefaults(defineProps<{
  data?: IncomeVsBudget | null
  currency?: string
  loading?: boolean
}>(), {
  data: null,
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')
const items = computed(() => props.data?.items ?? [])

const maxValue = computed(() => Math.max(1, ...items.value.flatMap(r => [num(r.budget), num(r.actual)])))

const bars = computed(() => items.value.map(r => ({
  key: r.categoryId,
  name: r.name,
  budget: num(r.budget),
  actual: num(r.actual),
  budgetPct: Math.max(2, (num(r.budget) / maxValue.value) * 100),
  actualPct: Math.max(2, (num(r.actual) / maxValue.value) * 100),
})))

const totalBudget = computed(() => num(props.data?.totalBudget))
const totalActual = computed(() => num(props.data?.totalActual))
const compliance = computed(() => props.data?.complianceRate ?? null)
</script>

<template>
  <UCard class="border border-white/10 hover:border-white/15">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div>
          <h2 class="font-display font-semibold">
            Presupuesto VS Ingreso
          </h2>
          <p class="text-sm text-neutral-400">
            Comparativa de ejecución por concepto
          </p>
        </div>
        <div class="flex items-center gap-3 text-xs shrink-0">
          <span class="flex items-center gap-1 text-neutral-400"><span class="w-2.5 h-2.5 rounded-sm bg-neutral-600 inline-block" /> Ppto</span>
          <span class="flex items-center gap-1 text-blue-300"><span class="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" /> Real</span>
        </div>
      </div>
    </template>

    <div v-if="loading && bars.length === 0" class="h-48 flex items-end justify-around gap-4 pt-4 pb-2 px-2 animate-pulse">
      <div v-for="n in 3" :key="n" class="flex items-end gap-1.5 h-full">
        <div class="w-4 rounded-t bg-white/10 h-2/3" />
        <div class="w-4 rounded-t bg-white/10 h-1/2" />
      </div>
    </div>

    <div v-else-if="bars.length === 0" class="py-8">
      <UEmpty icon="i-lucide-chart-column" title="Sin rubros de ingreso" description="No hay ejecución de ingresos en el periodo." />
    </div>

    <template v-else>
      <div class="h-48 flex items-end justify-between gap-4 pt-4 pb-2 px-2 border-b border-white/5">
        <div v-for="bar in bars" :key="bar.key" class="flex-1 flex flex-col items-center h-full justify-end min-w-0">
          <div class="w-full flex items-end justify-center gap-1.5 h-full">
            <div class="w-4 bg-neutral-600 rounded-t" :style="{ height: `${bar.budgetPct}%` }" :title="`Ppto: ${formatMoney(bar.budget, moneda)}`" />
            <div class="w-4 bg-blue-400 rounded-t" :style="{ height: `${bar.actualPct}%` }" :title="`Real: ${formatMoney(bar.actual, moneda)}`" />
          </div>
          <span class="text-xs text-neutral-200 mt-2 truncate w-full text-center">{{ bar.name }}</span>
          <span class="text-xs tabular-nums" :class="bar.actual >= bar.budget ? 'text-emerald-300' : 'text-neutral-400'">{{ formatCompact(bar.actual, moneda) }}</span>
        </div>
      </div>

      <div class="pt-3 flex items-center justify-between text-sm text-neutral-400 gap-2">
        <span class="shrink-0">Cumplimiento Total</span>
        <span class="text-emerald-300 font-semibold tabular-nums truncate">
          {{ formatExecution(compliance) }} ({{ formatMoney(totalActual, moneda) }} / {{ formatMoney(totalBudget, moneda) }})
        </span>
      </div>
    </template>
  </UCard>
</template>
