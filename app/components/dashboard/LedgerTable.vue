<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { LedgerRow, LedgerSummary } from '~/services/dashboard.service'
import { budgetStatusMeta } from '~/utils/budget-status'
import { formatMoney, formatVariance, num } from '~/utils/format'

const props = withDefaults(defineProps<{
  title: string
  icon: string
  mode: 'income' | 'expense'
  summary?: LedgerSummary | null
  currency?: string
  loading?: boolean
  badge?: string
}>(), {
  summary: null,
  currency: 'MXN',
  loading: false,
  badge: undefined,
})

const moneda = computed(() => props.currency || 'MXN')
const rows = computed<LedgerRow[]>(() => props.summary?.rows ?? [])

const defaultBadge = computed(() => {
  if (props.mode === 'income') {
    const n = num(props.summary?.activeCount)
    return `${n} Rubro${n === 1 ? '' : 's'} Activo${n === 1 ? '' : 's'}`
  }
  const over = rows.value.filter(r => r.status === 'exceeded' || r.status === 'unbudgeted').length
  return over > 0 ? 'Sobregiro detectado' : 'Ejecución bajo control'
})

const columns: TableColumn<LedgerRow>[] = [
  { accessorKey: 'name', header: 'Categoría', meta: {class: { th:'text-neutral-200' } } },
  { accessorKey: 'budget', header: 'Presupuesto', meta: { class: { th: 'text-right text-neutral-200', td: 'text-right' } } },
  { accessorKey: 'actual', header: 'Monto Real', meta: { class: { th: 'text-right text-neutral-200', td: 'text-right' } } },
  { accessorKey: 'variance', header: props.mode === 'income' ? 'Desviación' : 'Estado', meta: { class: { th: 'text-right text-neutral-200', td: 'text-right' } } },
]

function varianceLabel(row: LedgerRow): string {
  const meta = budgetStatusMeta(row.status)
  if (row.status === 'unbudgeted') return meta.label
  return `${meta.label} · ${formatVariance(row.variance, moneda.value)}`
}
</script>

<template>
  <UCard class="border border-white/10 hover:border-white/15" :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h2 class="font-display font-bold">
            {{ title }}
          </h2>
        </div>
        <UBadge :color="mode === 'income' ? 'success' : 'error'" variant="soft">
          {{ badge ?? defaultBadge }}
        </UBadge>
      </div>
    </template>

    <div v-if="loading && rows.length === 0" class="flex flex-col gap-1 p-4 animate-pulse">
      <div v-for="n in 4" :key="n" class="flex items-center justify-between py-2">
        <div class="h-3 w-28 rounded bg-white/10" />
        <div class="h-3 w-40 rounded bg-white/10" />
      </div>
    </div>

    <UTable v-else :data="rows" :columns="columns" class="[&_tbody_td]:py-3">
      <template #name-cell="{ row }">
        <span class="flex items-center gap-2 font-medium">
          <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: row.original.color || '#64748b' }" />
          {{ row.original.name }}
        </span>
      </template>
      <template #budget-cell="{ row }">
        <span class="tabular-nums text-neutral-400">{{ formatMoney(row.original.budget, moneda) }}</span>
      </template>
      <template #actual-cell="{ row }">
        <span class="tabular-nums font-light" :class="mode === 'income' ? 'text-green-300' : ''">{{ formatMoney(row.original.actual, moneda) }}</span>
      </template>
      <template #variance-cell="{ row }">
        <UBadge v-if="mode === 'expense'" :color="budgetStatusMeta(row.original.status).color" variant="soft" size="sm">
          {{ varianceLabel(row.original) }}
        </UBadge>
        <span v-else class="tabular-nums font-light" :class="num(row.original.variance) >= 0 ? 'text-green-300' : 'text-rose-300'">
          {{ formatVariance(row.original.variance, moneda) }}
        </span>
      </template>
      <template #empty>
        <div class="flex flex-col items-center justify-center py-10 gap-2">
          <UIcon name="i-lucide-inbox" class="size-7 text-white/25" />
          <p class="text-sm text-white/45 font-medium">Sin movimientos en el periodo.</p>
        </div>
      </template>
    </UTable>

    <template #footer>
      <div class="flex items-center justify-between text-sm font-semibold gap-2">
        <span class="shrink-0">{{ mode === 'income' ? 'Total Ingresos' : 'Total Egresos' }}</span>
        <div class="flex items-center gap-4 tabular-nums min-w-0">
          <span class="text-neutral-400">{{ formatMoney(summary?.totalBudget, moneda) }}</span>
          <span :class="mode === 'income' ? 'text-green-300' : 'text-rose-300'">{{ formatMoney(summary?.totalActual, moneda) }}</span>
          <span :class="num(summary?.totalVariance) >= 0 ? 'text-green-300' : 'text-rose-300'">{{ formatVariance(summary?.totalVariance, moneda) }}</span>
        </div>
      </div>
    </template>
  </UCard>
</template>
