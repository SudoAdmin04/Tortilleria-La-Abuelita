<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { BudgetLine } from '~/composables/useReportes'
import { formatExecution, formatMoney, formatVariance } from '~/utils/format'

const UBadge = resolveComponent('UBadge')
const UProgress = resolveComponent('UProgress')

const props = withDefaults(defineProps<{
  data?: BudgetLine[]
  currency?: string
  loading?: boolean
}>(), {
  data: () => [],
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')
const expanded = ref<Record<string, boolean>>({})

const estadoMeta: Record<string, { label: string, color: 'success' | 'warning' | 'error' | 'neutral' }> = {
  within: { label: 'En orden', color: 'success' },
  near: { label: 'Cerca del límite', color: 'warning' },
  exceeded: { label: 'Excedido', color: 'error' },
  unbudgeted: { label: 'Sin presupuesto', color: 'neutral' },
  met: { label: 'Meta cumplida', color: 'success' },
  below: { label: 'Por debajo', color: 'success' },
}

const columnas: TableColumn<BudgetLine>[] = [
  {
    accessorKey: 'name',
    header: 'Rubro / partida',
    cell: ({ row }) => {
      const r = row.original
      const hasItems = Array.isArray(r.items) && r.items.length > 0
      return h('div', { class: 'flex items-center gap-2' }, [
        hasItems
          ? h('button', {
              class: 'size-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 text-xs shrink-0',
              onClick: (e: Event) => {
                e.stopPropagation()
                expanded.value[r.categoryId] = !expanded.value[r.categoryId]
              },
            }, expanded.value[r.categoryId] ? '−' : '+')
          : null,
        h('div', { class: 'flex items-center gap-2 min-w-0' }, [
          r.color ? h('span', { class: 'w-2.5 h-2.5 rounded-full shrink-0', style: { backgroundColor: r.color } }) : null,
          h('span', { class: 'text-sm font-semibold text-white truncate' }, r.name),
        ]),
      ])
    },
  },
  {
    accessorKey: 'budget',
    header: () => h('div', { class: 'text-right' }, 'Planeado'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('span', { class: 'text-sm text-white/60 whitespace-nowrap' },
      formatMoney(row.original.budget, moneda.value)),
  },
  {
    accessorKey: 'actual',
    header: () => h('div', { class: 'text-right' }, 'Ejecutado'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('span', { class: 'text-sm font-semibold text-white whitespace-nowrap' },
      formatMoney(row.original.actual, moneda.value)),
  },
  {
    accessorKey: 'variance',
    header: () => h('div', { class: 'text-right' }, 'Varianza'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const v = row.original.variance
      return h('span', {
        class: `text-sm font-semibold whitespace-nowrap ${v > 0 ? 'text-red-300' : v < 0 ? 'text-emerald-300' : 'text-white/50'}`,
      }, formatVariance(v, moneda.value))
    },
  },
  {
    accessorKey: 'executionRate',
    header: '% Ejecución',
    cell: ({ row }) => {
      const r = row.original
      const pct = Math.min(100, Math.max(0, Math.round(r.executionRate ?? 0)))
      return h('div', { class: 'flex flex-col gap-1 min-w-28' }, [
        h(UProgress, { modelValue: pct, max: 100, size: 'xs', color: r.status === 'exceeded' ? 'error' : r.status === 'near' ? 'warning' : 'primary' }),
        h('span', { class: 'text-xs text-white/50' }, formatExecution(r.executionRate)),
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

const rows = computed(() => {
  const out: { line: BudgetLine, depth: number }[] = []
  for (const r of props.data) {
    out.push({ line: r, depth: 0 })
    if (expanded.value[r.categoryId] && Array.isArray(r.items)) {
      for (const it of r.items)
        out.push({ line: it, depth: 1 })
    }
  }
  return out
})
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
            Presupuesto vs real
          </h2>
          <p class="text-sm text-neutral-400">
            Rubros con sus partidas · expande para ver el detalle
          </p>
        </div>
        <UBadge v-if="props.data.length" size="sm" color="primary" variant="subtle" class="px-2.5 font-semibold">
          {{ props.data.length }} {{ props.data.length === 1 ? 'Rubro' : 'Rubros' }}
        </UBadge>
      </div>
    </template>
    <template #default>
      <UTable
        :columns="columnas"
        :data="rows.map(r => r.line)"
        :loading="props.loading"
        sticky
        class="w-full"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 gap-3">
            <UIcon name="i-lucide-circle-x" class="size-8 text-white/30" />
            <p class="text-sm text-white/50 font-medium">
              Sin presupuesto en el periodo.
            </p>
          </div>
        </template>
      </UTable>
    </template>
  </UCard>
</template>
