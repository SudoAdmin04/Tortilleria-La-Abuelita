<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Debt } from '~/services/debts.service'
import { formatMoney } from '~/utils/format'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UProgress = resolveComponent('UProgress')

const props = defineProps<{
  data: Debt[]
  total: number
  loading: boolean
  currency?: string
}>()

const emit = defineEmits<{
  edit: [deuda: Debt]
  settle: [deuda: Debt]
  delete: [id: string]
}>()

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const columnas: TableColumn<Debt>[] = [
  {
    accessorKey: 'name',
    header: 'Deuda',
    cell: ({ row }) => h('div', { class: 'flex flex-col min-w-0' }, [
      h('span', { class: 'text-sm font-semibold text-white truncate' }, row.original.name),
      h('span', { class: 'text-xs text-white/50 truncate' }, `${row.original.counterparty || '—'} · ${row.original.direction === 'payable' ? 'Yo debo' : 'Me deben'}`),
    ]),
  },
  {
    accessorKey: 'principalAmount',
    header: 'Principal / Vivo',
    cell: ({ row }) => h('div', { class: 'flex flex-col min-w-0' }, [
      h('span', { class: 'text-sm font-semibold text-white' }, formatMoney(row.original.principalAmount, props.currency || 'MXN')),
      h('span', { class: 'text-xs text-white/50' }, `Vivo: ${formatMoney(row.original.outstanding, props.currency || 'MXN')}`),
    ]),
  },
  {
    accessorKey: 'paidAmount',
    header: 'Avance',
    cell: ({ row }) => {
      const pct = row.original.principalAmount ? Math.round((row.original.paidAmount / row.original.principalAmount) * 100) : 0
      return h('div', { class: 'flex flex-col gap-1 min-w-28' }, [
        h(UProgress, { value: Math.min(100, pct), size: 'xs' }),
        h('span', { class: 'text-xs text-white/50' }, `${pct}% amortizado`),
      ])
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const paid = row.original.status === 'paid'
      return h(UBadge, {
        color: paid ? 'success' : 'warning',
        variant: 'subtle',
        size: 'sm',
        class: 'capitalize font-medium',
      }, () => paid ? 'Liquidada' : 'Vigente')
    },
  },
  {
    accessorKey: 'dueDate',
    header: 'Vencimiento',
    cell: ({ row }) => h('span', formatDate(row.original.dueDate)),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right pr-2' }, 'Acciones'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const record = row.original
      const menu: any[] = [
        {
          label: 'Editar',
          icon: 'i-heroicons-pencil-square',
          onSelect: () => emit('edit', record),
        },
      ]
      if (record.status === 'open') {
        menu.push({
          label: 'Liquidar',
          icon: 'i-heroicons-check-badge',
          onSelect: () => emit('settle', record),
        })
      }
      menu.push({
        label: 'Eliminar',
        icon: 'i-heroicons-trash',
        color: 'error' as const,
        onSelect: () => emit('delete', record.id),
      })
      return h('div', { class: 'flex justify-end pr-1' }, [
        h(UDropdownMenu, {
          items: [menu],
          content: { align: 'end' },
        }, {
          default: () => h(UButton, {
            icon: 'i-heroicons-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            size: 'xs',
            class: 'text-white/60 hover:text-white hover:bg-white/10 rounded-lg',
            'aria-label': 'Acciones',
          }),
        }),
      ])
    },
  },
]

const pageCountOptions = [10, 25, 50, 75, 100]
const page = defineModel<number>('page', { default: 1 })
const itemsPerPage = defineModel<number>('pageCount', { default: 10 })
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
  return `Mostrando ${start}-${end} de ${props.total} deudas registradas`
})
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <UCard
      class="border border-white/10 overflow-hidden"
      :ui="{
        header: 'py-3.5 px-5 border-b border-white/10 bg-white/[0.02]',
        body: 'p-0 overflow-x-auto',
        footer: 'py-3 px-5 border-t border-white/10 bg-white/[0.01]',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-white tracking-wide">Gestión de Deudas</span>
          </div>
          <UBadge v-if="totalItems" size="sm" color="primary" variant="subtle" class="px-2.5 font-semibold">
            {{ totalItems }} {{ totalItems === 1 ? 'Deuda' : 'Deudas' }}
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
          :ui="{ tr: 'hover:bg-white/[0.01] transition-colors duration-150 cursor-pointer'}"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center py-12 gap-3">
              <UIcon name="i-heroicons-x-circle" class="size-8 text-white/30" />
              <p class="text-sm text-white/50 font-medium">No hay deudas que coincidan con los criterios.</p>
            </div>
          </template>
        </UTable>
      </template>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span class="text-white/60 font-medium">
            {{ pageLabel }}
          </span>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-white/40">Filas por página:</span>
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
