<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Transaction } from '~/services/transactions.service'
import { formatMoney, formatDate } from '~/utils/format'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UTooltip = resolveComponent('UTooltip')

const props = defineProps<{
  data: Transaction[]
  total: number
  loading: boolean
  currency?: string
  puedeEditar?: boolean
  puedeEliminar?: boolean
}>()

const emit = defineEmits<{
  edit: [tx: Transaction]
  delete: [id: string]
  reconcile: [id: string]
}>()

const moneda = computed(() => props.currency || 'MXN')

const tipoBadge: Record<Transaction['type'], { color: 'success' | 'error' | 'info', label: string }> = {
  income: { color: 'success', label: 'Ingreso' },
  expense: { color: 'error', label: 'Egreso' },
  transfer: { color: 'info', label: 'Traspaso' },
}

function montoSigno(t: Transaction): { texto: string, clase: string } {
  const base = formatMoney(t.amount, moneda.value)
  if (t.type === 'income') return { texto: `+${base}`, clase: 'text-emerald-600 dark:text-emerald-400' }
  if (t.type === 'expense') return { texto: `−${base}`, clase: 'text-red-600 dark:text-red-400' }
  return { texto: base, clase: 'text-default' }
}

function lineaMovimiento(t: Transaction): string {
  const origen = t.account?.name || '—'
  if (t.type === 'transfer') {
    return `${origen} → ${t.destinationAccount?.name || '—'}`
  }
  return `${origen} · ${t.category?.name || 'Sin categoría'}`
}

const columnas: TableColumn<Transaction>[] = [
  {
    accessorKey: 'concept',
    header: 'Movimiento',
    cell: ({ row }) => {
      const t = row.original
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'text-sm font-semibold text-default truncate' }, t.concept),
        h('span', { class: 'text-xs text-default/50 truncate' }, lineaMovimiento(t)),
      ])
    },
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const b = tipoBadge[row.original.type]
      return h(UBadge, { color: b.color, variant: 'subtle', class: 'font-semibold w-fit' }, () => b.label)
    },
  },
  {
    accessorKey: 'amount',
    header: () => h('div', { class: 'text-right' }, 'Monto'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const m = montoSigno(row.original)
      return h('div', { class: 'text-right' }, [
        h('span', { class: `text-sm font-bold whitespace-nowrap ${m.clase}` }, m.texto),
      ])
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const conciliado = row.original.status === 'reconciled'
      return h(UBadge, {
        color: conciliado ? 'success' : 'warning',
        variant: 'subtle',
        size: 'sm',
        class: 'font-semibold w-fit',
      }, () => conciliado ? 'Conciliado' : 'Pendiente')
    },
  },
  {
    accessorKey: 'date',
    header: 'Fecha',
    cell: ({ row }) => h('span', { class: 'text-sm whitespace-nowrap' }, formatDate(row.original.date)),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right pr-2' }, 'Acciones'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const record = row.original
      const pendiente = record.status === 'pending'
      const dropdownItems = [
        [
          ...(props.puedeEditar !== false
            ? [{
                label: 'Editar',
                icon: 'i-lucide-square-pen',
                onSelect: () => emit('edit', record),
              }]
            : []),
          ...(pendiente && props.puedeEditar !== false
            ? [{
                label: 'Conciliar',
                icon: 'i-lucide-badge-check',
                onSelect: () => emit('reconcile', record.id),
              }]
            : []),
          ...(props.puedeEliminar !== false
            ? [{
                label: 'Eliminar',
                icon: 'i-lucide-trash-2',
                color: 'error' as const,
                onSelect: () => emit('delete', record.id),
              }]
            : []),
        ],
      ]
      return h('div', { class: 'flex justify-end items-center gap-1 pr-1' }, [
        pendiente && props.puedeEditar !== false
          ? 
          h(UTooltip, { text: 'Conciliar' }, () =>
            h(UButton, {
              icon: 'i-lucide-badge-check',
              color: 'neutral',
              variant: 'soft',
              size: 'xs',
              class: 'hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg',
              'aria-label': `Conciliar ${record.concept}`,
              onClick: (e: Event) => { e.stopPropagation(); emit('reconcile', record.id) },
            })
          )
          : null,
        h(UDropdownMenu, {
          items: dropdownItems,
          content: { align: 'end' },
        }, {
          default: () => h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            size: 'xs',
            class: 'text-default/60 hover:text-default hover:bg-elevated rounded-lg',
            'aria-label': 'Acciones',
          }),
        }),
      ])
    },
  },
]

const pageCountOptions = [10, 20, 50, 100]
const page = defineModel<number>('page', { default: 1 })
const itemsPerPage = defineModel<number>('pageCount', { default: 20 })
const totalItems = computed(() => props.total ?? props.data.length)
const totalPaginas = computed(() => Math.ceil((props.total || 0) / itemsPerPage.value) || 1)

watch([itemsPerPage, () => props.total], () => {
  if (page.value > totalPaginas.value) {
    page.value = 1
  }
})

const pageLabel = computed(() => {
  if (!props.total) return 'Mostrando 0 registros'
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, props.total)
  return `Mostrando ${start}-${end} de ${props.total} movimientos registrados`
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
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold tracking-wide">Gestión de Transacciones</span>
          </div>
          <UBadge v-if="totalItems" size="sm" color="primary" variant="subtle" class="px-2.5 font-semibold">
            {{ totalItems }} {{ totalItems === 1 ? 'Movimiento' : 'Movimientos' }}
          </UBadge>
        </div>
      </template>

      <template #default>
        <UTable
          data-key="id"
          :columns="columnas"
          :data="props.data"
          :loading="props.loading"
          sticky
          class="w-full"
          :ui="{ tr: 'hover:bg-elevated/50 transition-colors duration-150 cursor-pointer'}"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center py-12 gap-3">
              <UIcon name="i-lucide-circle-x" class="size-8 text-default/30" />
              <p class="text-sm text-default/50 font-medium">No hay movimientos que coincidan con los criterios.</p>
            </div>
          </template>
        </UTable>
      </template>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span class="text-default/60 font-medium">
            {{ pageLabel }}
          </span>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-default/40">Filas por página:</span>
              <USelect
                v-model="itemsPerPage"
                :items="pageCountOptions"
                size="xs"
                class="w-16"
              />
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
