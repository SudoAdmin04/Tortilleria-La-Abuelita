<script setup lang="ts">
import type { ExpenseDistribution } from '~/services/transactions.service'
import { formatMoney, formatVariance, num } from '~/utils/format'

const props = withDefaults(defineProps<{
  data?: ExpenseDistribution | null
  currency?: string
  loading?: boolean
}>(), {
  data: null,
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')
const FALLBACK = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#64748b']

const items = computed(() => props.data?.items ?? [])
const total = computed(() => num(props.data?.total))

const budgetTotal = computed(() => {
  const api = num((props.data as { budgetTotal?: number } | null)?.budgetTotal)
  if (api > 0) return api
  return items.value.reduce((acc, it) => acc + num(it.budget), 0)
})

const variance = computed(() => {
  const api = (props.data as { variance?: number } | null)?.variance
  if (typeof api === 'number') return api
  return total.value - budgetTotal.value
})

const isOver = computed(() => {
  const api = (props.data as { isOverBudget?: boolean } | null)?.isOverBudget
  if (typeof api === 'boolean') return api
  return variance.value > 0
})

function colorOf(index: number): string {
  return items.value[index]?.color || FALLBACK[index % FALLBACK.length]!
}

function widthOf(index: number): number {
  const item = items.value[index]
  if (!item) return 0
  const pct = num(item.percent)
  if (pct > 0) return Math.min(100, Math.max(0, pct))
  const tot = total.value
  if (tot > 0) return Math.min(100, Math.max(0, (num(item.amount) / tot) * 100))
  return 0
}

function formattedPercent(index: number): string {
  const w = widthOf(index)
  return w.toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
</script>

<template>
  <UCard
    class="bg-default border border-default rounded-xl shadow-xl overflow-hidden"
    :ui="{
      header: 'py-3.5 px-5 border-b border-default bg-elevated/60',
      body: 'p-5 flex flex-col gap-5',
      footer: 'py-3 px-5 border-t border-default bg-elevated/60',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex flex-col min-w-0">
            <h3 class="text-sm font-bold text-highlighted tracking-wide truncate">Distribución de Gastos</h3>
            <p class="text-xs text-muted truncate">Participación porcentual de los egresos</p>
          </div>
        </div>

        <UBadge size="sm" color="neutral" variant="subtle" class="font-semibold tabular-nums shrink-0 rounded-lg">
          Total: {{ formatMoney(total, moneda) }}
        </UBadge>
      </div>
    </template>

    <template v-if="loading && items.length === 0">
      <div class="flex flex-col gap-4 animate-pulse">
        <div class="h-3 rounded-full bg-elevated w-full" />
        <div v-for="n in 4" :key="n" class="flex items-center justify-between py-1">
          <div class="flex items-center gap-2.5">
            <div class="size-3 rounded-full bg-elevated" />
            <div class="h-3.5 w-32 rounded bg-elevated" />
          </div>
          <div class="h-3.5 w-24 rounded bg-elevated" />
        </div>
      </div>
    </template>

    <template v-else-if="items.length === 0">
      <div class="flex flex-col items-center justify-center py-10 gap-2.5 text-center">
        <div class="size-10 rounded-full bg-elevated flex items-center justify-center text-dimmed">
          <UIcon name="i-lucide-chart-pie" class="size-5" />
        </div>
        <p class="text-xs text-muted font-medium">Sin egresos registrados en este periodo.</p>
      </div>
    </template>

    <template v-else>
      <div class="flex h-4 w-full overflow-hidden rounded-full bg-elevated p-0.5 border border-default gap-0.5">
        <div
          v-for="(it, i) in items"
          :key="it.categoryId || it.name || i"
          class="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 hover:opacity-80 cursor-pointer"
          :style="{ width: `${widthOf(i)}%`, backgroundColor: colorOf(i) }"
          :title="`${it.name}: ${formatMoney(it.amount, moneda)} (${formattedPercent(i)}%)`"
        />
      </div>

      <ul class="flex flex-col gap-1.5">
        <li
          v-for="(it, i) in items"
          :key="it.categoryId || it.name || i"
          class="flex items-center justify-between gap-3 text-xs py-1.5 px-2 rounded-lg hover:bg-elevated transition-colors"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="size-2 rounded-full shrink-0 shadow-sm"
              :style="{ backgroundColor: colorOf(i) }"
            />
            <span class="truncate font-semibold text-highlighted">{{ it.name }}</span>
          </div>

          <div class="flex items-center gap-2 shrink-0 tabular-nums">
            <span class="font-bold text-highlighted">{{ formatMoney(it.amount, moneda) }}</span>
            <span class="text-[11px] font-medium text-muted min-w-11 text-right">
              ({{ formattedPercent(i) }}%)
            </span>
          </div>
        </li>
      </ul>
    </template>

    <template #footer>
      <div class="flex items-center justify-between gap-3 text-xs">
        <span class="text-muted truncate flex items-center gap-1.5">
          <UIcon name="i-lucide-calculator" class="size-3.5 text-muted shrink-0" />
          Presupuesto: <strong class="text-toned font-semibold">{{ formatMoney(budgetTotal, moneda) }}</strong>
        </span>

        <UBadge
          v-if="items.length > 0"
          :color="isOver ? 'error' : 'success'"
          variant="subtle"
          size="xs"
          class="font-bold tabular-nums shrink-0 rounded-md"
        >
          {{ isOver ? 'Exceso: ' : 'Ahorro: ' }}{{ formatVariance(variance, moneda) }}
        </UBadge>

        <span v-else class="text-dimmed italic text-[11px]">Sin datos</span>
      </div>
    </template>
  </UCard>
</template>