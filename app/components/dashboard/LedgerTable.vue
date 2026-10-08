<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { BudgetLine } from '~/types/dashboard'
import { budgetStatusMeta } from '~/utils/budget-status'
import { formatMoney, formatVariance, num } from '~/utils/format'

const props = defineProps<{
  title: string
  icon: string
  badge: string
  mode: 'income' | 'expense'
  rows: BudgetLine[]
  totalLabel: string
  totalBudget: number
  totalActual: number
  totalVariance: number
  currency: string
}>()

const columns: TableColumn<BudgetLine>[] = [
  { accessorKey: 'name', header: 'Categoría' },
  { accessorKey: 'budget', header: 'Presupuesto', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'actual', header: 'Monto Real', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'variance', header: props.mode === 'income' ? 'Desviación' : 'Estado', meta: { class: { th: 'text-right', td: 'text-right' } } },
]

function varianceLabel(row: BudgetLine): string {
  const meta = budgetStatusMeta(row.status)
  if (row.status === 'unbudgeted') return meta.label
  return `${meta.label} · ${formatVariance(row.variance, props.currency)}`
}
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon :name="icon" class="size-5" :class="mode === 'income' ? 'text-emerald-300' : 'text-rose-300'" />
          <h2 class="font-display font-semibold">
            {{ title }}
          </h2>
        </div>
        <UBadge :color="mode === 'income' ? 'success' : 'error'" variant="soft">
          {{ badge }}
        </UBadge>
      </div>
    </template>

    <UTable :data="rows" :columns="columns" class="[&_tbody_td]:py-3">
      <template #name-cell="{ row }">
        <span class="flex items-center gap-2 font-medium">
          <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: row.original.color || '#64748b' }" />
          {{ row.original.name }}
        </span>
      </template>
      <template #budget-cell="{ row }">
        <span class="tabular-nums text-neutral-400">{{ formatMoney(row.original.budget, currency) }}</span>
      </template>
      <template #actual-cell="{ row }">
        <span class="tabular-nums font-semibold">{{ formatMoney(row.original.actual, currency) }}</span>
      </template>
      <template #variance-cell="{ row }">
        <UBadge v-if="mode === 'expense'" :color="budgetStatusMeta(row.original.status).color" variant="soft">
          {{ varianceLabel(row.original) }}
        </UBadge>
        <span v-else class="tabular-nums font-medium" :class="num(row.original.variance) >= 0 ? 'text-emerald-300' : 'text-rose-300'">
          {{ formatVariance(row.original.variance, currency) }}
        </span>
      </template>
    </UTable>

    <template #footer>
      <div class="flex items-center justify-between text-sm font-semibold">
        <span>{{ totalLabel }}</span>
        <div class="flex items-center gap-4 tabular-nums">
          <span class="text-neutral-400">{{ formatMoney(totalBudget, currency) }}</span>
          <span :class="mode === 'income' ? 'text-emerald-300' : 'text-rose-300'">{{ formatMoney(totalActual, currency) }}</span>
          <span :class="num(totalVariance) >= 0 ? 'text-emerald-300' : 'text-rose-300'">{{ formatVariance(totalVariance, currency) }}</span>
        </div>
      </div>
    </template>
  </UCard>
</template>

