<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { AnalyticsLeakageItem } from '~/services/reports.service'
import { formatMoney } from '~/utils/format'

const UBadge = resolveComponent('UBadge')
const UProgress = resolveComponent('UProgress')

const props = withDefaults(defineProps<{
  data?: AnalyticsLeakageItem[]
  currency?: string
  loading?: boolean
}>(), {
  data: () => [],
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')

const estadoMeta: Record<string, { label: string, color: 'success' | 'warning' | 'error' | 'neutral' }> = {
  within: { label: 'En orden', color: 'success' },
  near: { label: 'Cerca del límite', color: 'warning' },
  exceeded: { label: 'Excedido', color: 'error' },
  unbudgeted: { label: 'Sin presupuesto', color: 'neutral' },
  met: { label: 'Meta cumplida', color: 'success' },
  below: { label: 'Por debajo', color: 'success' },
}

const columnas: TableColumn<AnalyticsLeakageItem>[] = [
  {
    accessorKey: 'name',
    header: 'Rubro',
    cell: ({ row }) => h('span', { class: 'text-sm font-semibold text-white' }, row.original.name),
  },
  {
    accessorKey: 'actual',
    header: () => h('div', { class: 'text-right' }, 'Gasto'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('span', { class: 'text-sm font-semibold text-white whitespace-nowrap' },
      formatMoney(row.original.actual, moneda.value)),
  },
  {
    accessorKey: 'percentOfExpense',
    header: '% del gasto',
    cell: ({ row }) => {
      const r = row.original
      const pct = Math.min(100, Math.max(0, Math.round(r.percentOfExpense)))
      return h('div', { class: 'flex flex-col gap-1 min-w-28' }, [
        h(UProgress, { modelValue: pct, max: 100, size: 'xs', color: r.status === 'exceeded' ? 'error' : 'primary' }),
        h('span', { class: 'text-xs text-white/50' }, `${pct}%`),
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
    class="border border-white/10 overflow-hidden"
    :ui="{ header: 'py-3.5 px-5 border-b border-white/10 bg-white/[0.02]', body: 'p-0 overflow-x-auto' }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="font-display font-semibold">
            Fugas de gasto
          </h2>
          <p class="text-sm text-neutral-400">
            Rubros por monto y estado
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
            <UIcon name="i-lucide-circle-x" class="size-8 text-white/30" />
            <p class="text-sm text-white/50 font-medium">
              Sin fugas en el periodo.
            </p>
          </div>
        </template>
      </UTable>
    </template>
  </UCard>
</template>
