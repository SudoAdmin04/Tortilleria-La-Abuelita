<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { PresupuestoRow } from '~/composables/usePresupuestos'
import { formatMoney, formatExecution } from '~/utils/format'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UProgress = resolveComponent('UProgress')

const props = defineProps<{
  data: PresupuestoRow[]
  loading: boolean
  currency?: string
}>()

const emit = defineEmits<{
  view: [row: PresupuestoRow]
  edit: [row: PresupuestoRow]
  delete: [row: PresupuestoRow]
}>()

const moneda = computed(() => props.currency || 'MXN')

const estadoMeta: Record<string, { label: string, color: 'success' | 'warning' | 'error' | 'neutral' }> = {
  within: { label: 'En orden', color: 'success' },
  near: { label: 'Cerca del límite', color: 'warning' },
  exceeded: { label: 'Excedido', color: 'error' },
  unbudgeted: { label: 'Sin presupuesto', color: 'neutral' },
  met: { label: 'Meta cumplida', color: 'success' },
  below: { label: 'Por debajo', color: 'success' },
}

const columnas: TableColumn<PresupuestoRow>[] = [
  {
    accessorKey: 'name',
    header: 'Rubro',
    cell: ({ row }) => {
      const r = row.original
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'text-sm font-semibold text-white truncate' }, r.name),
        h('span', { class: 'text-xs text-white/50 truncate' }, r.kind),
      ])
    },
  },
  {
    accessorKey: 'planificado',
    header: () => h('div', { class: 'text-right' }, 'Planeado / Real'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const r = row.original
      return h('div', { class: 'flex flex-col items-end min-w-0' }, [
        h('span', { class: 'text-sm font-semibold text-white whitespace-nowrap' }, formatMoney(r.planificado, moneda.value)),
        h('span', { class: 'text-xs text-white/50 whitespace-nowrap' }, `Real: ${formatMoney(r.ejecutado, moneda.value)}`),
      ])
    },
  },
  {
    accessorKey: 'tasaEjecucion',
    header: 'Ejecución',
    cell: ({ row }) => {
      const r = row.original
      const pct = r.tasaEjecucion != null ? Math.min(100, Math.max(0, Math.round(r.tasaEjecucion))) : 0
      return h('div', { class: 'flex flex-col gap-1 min-w-28' }, [
        h(UProgress, { modelValue: pct, max: 100, size: 'xs', color: r.estado === 'exceeded' ? 'error' : r.estado === 'near' ? 'warning' : 'primary' }),
        h('span', { class: 'text-xs text-white/50' }, formatExecution(r.tasaEjecucion)),
      ])
    },
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const r = row.original
      const meta = estadoMeta[r.estado] ?? { label: r.estado, color: 'neutral' as const }
      return h(UBadge, { color: meta.color, variant: 'subtle', size: 'sm', class: 'font-semibold w-fit' }, () => meta.label)
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right pr-2' }, 'Acciones'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const record = row.original
      const items = [[
        { label: 'Ver detalle', icon: 'i-lucide-eye', onSelect: () => emit('view', record) },
        { label: 'Ajustar', icon: 'i-lucide-square-pen', onSelect: () => emit('edit', record) },
        { label: 'Eliminar', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => emit('delete', record) },
      ]]
      return h('div', { class: 'flex justify-end pr-1' }, [
        h(UDropdownMenu, { items, content: { align: 'end' } }, {
          default: () => h(UButton, {
            icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost', size: 'xs',
            class: 'text-white/60 hover:text-white hover:bg-white/10 rounded-lg', 'aria-label': 'Acciones',
          }),
        }),
      ])
    },
  },
]
</script>

<template>
  <UCard
    class="border border-white/10 overflow-hidden"
    :ui="{ header: 'py-3.5 px-5 border-b border-white/10 bg-white/[0.02]', body: 'p-0 overflow-x-auto', footer: 'py-3 px-5 border-t border-white/10 bg-white/[0.01]' }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <span class="text-sm font-bold text-white tracking-wide">Comparativa planificado vs ejecutado</span>
        <UBadge v-if="props.data.length" size="sm" color="primary" variant="subtle" class="px-2.5 font-semibold">
          {{ props.data.length }} {{ props.data.length === 1 ? 'Rubro' : 'Rubros' }}
        </UBadge>
      </div>
    </template>
    <template #default>
      <UTable data-key="categoryId" :columns="columnas" :data="props.data" :loading="props.loading" sticky class="w-full" :ui="{ tr: 'hover:bg-white/[0.01] transition-colors duration-150' }">
        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 gap-3">
            <UIcon name="i-lucide-circle-x" class="size-8 text-white/30" />
            <p class="text-sm text-white/50 font-medium">Sin rubros para este mes.</p>
          </div>
        </template>
      </UTable>
    </template>
  </UCard>
</template>
