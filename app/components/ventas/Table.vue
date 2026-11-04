<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Sale } from '~/services/sales.service'
import { formatMoney, formatDate } from '~/utils/format'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const props = defineProps<{
  data: Sale[]
  total: number
  loading: boolean
  currency?: string
  puedeEditar?: boolean
}>()

const emit = defineEmits<{
  detail: [venta: Sale]
  cancel: [id: string]
}>()

const moneda = computed(() => props.currency || 'MXN')

const columnas: TableColumn<Sale>[] = [
  {
    accessorKey: 'customerName',
    header: 'Venta',
    cell: ({ row }) => {
      const v = row.original
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'text-sm font-semibold text-highlighted truncate' }, v.customerName || 'Mostrador'),
        h('span', { class: 'text-xs text-muted truncate' }, `${v.items.length} producto(s)`),
      ])
    },
  },
  {
    accessorKey: 'date',
    header: 'Fecha',
    cell: ({ row }) => h('span', { class: 'text-sm text-toned whitespace-nowrap' }, formatDate(row.original.date)),
  },
  {
    accessorKey: 'total',
    header: () => h('div', { class: 'text-right' }, 'Total'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const v = row.original
      return h('div', { class: 'flex flex-col items-end min-w-32' }, [
        h('span', { class: 'text-sm font-bold text-highlighted whitespace-nowrap' }, formatMoney(v.total, moneda.value)),
        h('span', { class: 'text-xs text-muted whitespace-nowrap' }, `Descuento ${formatMoney(v.discount, moneda.value)}`),
      ])
    },
  },
  {
    accessorKey: 'grossProfit',
    header: () => h('div', { class: 'text-right' }, 'Utilidad'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('span', {
      class: `text-sm font-semibold whitespace-nowrap ${row.original.grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`,
    }, formatMoney(row.original.grossProfit, moneda.value)),
  },
  {
    accessorKey: 'accountName',
    header: 'Cuenta',
    cell: ({ row }) => h('span', { class: 'text-sm text-toned truncate max-w-40 block' }, row.original.accountName || '—'),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => h(UBadge, {
      color: row.original.status === 'completed' ? 'success' : 'neutral',
      variant: 'subtle',
      size: 'sm',
      class: 'font-semibold w-fit',
    }, () => row.original.status === 'completed' ? 'Completada' : 'Cancelada'),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right pr-2' }, 'Acciones'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const record = row.original
      const items = [[
        { label: 'Ver detalle', icon: 'i-lucide-eye', onSelect: () => emit('detail', record) },
        ...(record.status === 'completed' && props.puedeEditar !== false
          ? [{ label: 'Cancelar venta', icon: 'i-lucide-ban', color: 'error' as const, onSelect: () => emit('cancel', record.id) }]
          : []),
      ]]
      return h('div', { class: 'flex justify-end pr-1' }, [
        h(UDropdownMenu, { items, content: { align: 'end' } }, {
          default: () => h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            size: 'xs',
            class: 'text-muted hover:text-highlighted hover:bg-elevated rounded-lg',
            'aria-label': 'Acciones',
          }),
        }),
      ])
    },
  },
]

const pageCountOptions = [10, 25, 50, 100]
const page = defineModel<number>('page', { default: 1 })
const itemsPerPage = defineModel<number>('pageCount', { default: 10 })
const totalItems = computed(() => props.total ?? props.data.length)
const totalPaginas = computed(() => Math.ceil((props.total || 0) / itemsPerPage.value) || 1)

watch([itemsPerPage, () => props.total], () => {
  if (page.value > totalPaginas.value) page.value = 1
})

const pageLabel = computed(() => {
  if (!props.total) return 'Mostrando 0 registros'
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, props.total)
  return `Mostrando ${start}-${end} de ${props.total} ventas registradas`
})
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <UCard
      class="border border-default overflow-hidden"
      :ui="{
        header: 'py-3.5 px-5 border-b border-default bg-elevated/60',
        body: 'p-0 overflow-x-auto',
        footer: 'py-3 px-5 border-t border-default bg-elevated/60',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm font-bold text-highlighted tracking-wide">Ventas del Negocio</span>
          <UBadge v-if="totalItems" size="sm" color="primary" variant="subtle" class="px-2.5 font-semibold">
            {{ totalItems }} {{ totalItems === 1 ? 'Venta' : 'Ventas' }}
          </UBadge>
        </div>
      </template>

      <UTable
        data-key="id"
        :columns="columnas"
        :data="props.data"
        :loading="props.loading"
        sticky
        class="w-full"
        :ui="{ tr: 'hover:bg-elevated/50 transition-colors duration-150' }"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 gap-3">
            <UIcon name="i-lucide-circle-x" class="size-8 text-dimmed" />
            <p class="text-sm text-muted font-medium">No hay ventas que coincidan con los criterios.</p>
          </div>
        </template>
      </UTable>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span class="text-muted font-medium">{{ pageLabel }}</span>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-muted">Filas por página:</span>
              <USelect v-model="itemsPerPage" :items="pageCountOptions" size="xs" class="w-16" />
            </div>
            <UPagination
              v-if="props.total > itemsPerPage || page > 1"
              v-model:page="page"
              :items-per-page="itemsPerPage"
              :total="props.total"
              size="xs"
            />
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>
