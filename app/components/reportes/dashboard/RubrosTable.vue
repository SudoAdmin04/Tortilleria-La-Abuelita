<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { BudgetLine } from '~/composables/useReportes'
import { formatExecution, formatMoney } from '~/utils/format'

const UBadge = resolveComponent('UBadge')
const UProgress = resolveComponent('UProgress')

const props = withDefaults(defineProps<{
  data?: BudgetLine[]
  currency?: string
  loading?: boolean
  title?: string
  subtitle?: string
  kind?: 'income' | 'expense'
}>(), {
  data: () => [],
  currency: 'MXN',
  loading: false,
  title: 'Rubros',
  subtitle: 'Presupuesto vs real del mes',
  kind: 'expense',
})

const moneda = computed(() => props.currency || 'MXN')

const estadoMeta: Record<string, { label: string, color: 'success' | 'warning' | 'error' | 'neutral' }> = {
  within: { label: 'En orden', color: 'success' },
  near: { label: 'Cerca del límite', color: 'warning' },
  exceeded: { label: 'Excedido', color: 'error' },
  unbudgeted: { label: 'Sin presupuesto', color: 'neutral' },
  met: { label: 'Meta cumplida', color: 'success' },
  below: { label: 'Por debajo', color: 'warning' },
}

const columnas: TableColumn<BudgetLine>[] = [
  {
    accessorKey: 'name',
    header: 'Rubro',
    cell: ({ row }) => h('span', { class: 'text-sm font-semibold text-highlighted' }, row.original.name),
  },
  {
    accessorKey: 'actual',
    header: () => h('div', { class: 'text-right' }, 'Real'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('span', { class: 'text-sm font-semibold text-highlighted whitespace-nowrap' },
      formatMoney(row.original.actual, moneda.value)),
  },
  {
    accessorKey: 'budget',
    header: () => h('div', { class: 'text-right' }, 'Ppto'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('span', { class: 'text-sm text-muted whitespace-nowrap' },
      formatMoney(row.original.budget, moneda.value)),
  },
  {
    accessorKey: 'executionRate',
    header: 'Ejecución',
    cell: ({ row }) => {
      const r = row.original
      const pct = Math.min(100, Math.max(0, Math.round(r.executionRate ?? 0)))
      return h('div', { class: 'flex flex-col gap-1 min-w-28' }, [
        h(UProgress, { modelValue: pct, max: 100, size: 'xs', color: r.status === 'exceeded' ? 'error' : 'primary' }),
        h('span', { class: 'text-xs text-muted' }, formatExecution(r.executionRate)),
      ])
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const r = row.original
      const meta = estadoMeta[r.status] ?? { label: r.status || '—', color: 'neutral' as const }
      return h(UBadge, { color: meta.color, variant: 'subtle', size: 'sm', class: 'font-semibold w-fit' }, () => meta.label)
    },
  },
]
</script>

<template>
  <UCard
    class="border border-default overflow-hidden"
    :ui="{ header: 'py-3.5 px-5 border-b border-default bg-elevated/60', body: 'p-0 overflow-x-auto' }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="font-display font-semibold">
            {{ props.title }}
          </h2>
          <p class="text-sm text-muted">
            {{ props.subtitle }}
          </p>
        </div>
        <UBadge v-if="props.data.length" size="sm" color="primary" variant="subtle" class="px-2.5 font-semibold">
          {{ props.data.length }} {{ props.data.length === 1 ? 'Rubro' : 'Rubros' }}
        </UBadge>
      </div>
    </template>
    <template #default>
      <UTable :columns="columnas" :data="props.data" :loading="props.loading" sticky class="w-full">
        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 gap-3">
            <UIcon name="i-lucide-circle-x" class="size-8 text-dimmed" />
            <p class="text-sm text-muted font-medium">
              Sin rubros en el periodo.
            </p>
          </div>
        </template>
      </UTable>
    </template>
  </UCard>
</template>
