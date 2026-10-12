<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Debt } from '~/services/debts.service'
import { isVencida } from '~/composables/useDeudas'
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
  puedeEditar?: boolean
  puedeEliminar?: boolean
}>()

const emit = defineEmits<{
  edit: [deuda: Debt]
  settle: [deuda: Debt]
  delete: [id: string]
}>()

const moneda = computed(() => props.currency || 'MXN')

const directionLabel: Record<Debt['direction'], string> = {
  payable: 'Yo debo',
  receivable: 'Me deben',
}

function pctAmortizado(d: Debt): number {
  if (!d.principalAmount) return 0
  return Math.min(100, Math.max(0, Math.round((d.paidAmount / d.principalAmount) * 100)))
}

function etiquetaVencimiento(v: string | null): string {
  if (!v) return '—'
  const partes = v.split('-')
  if (partes.length >= 3) return `${partes[2]}/${partes[1]}/${partes[0]}`
  return v
}

const columnas: TableColumn<Debt>[] = [
  {
    accessorKey: 'name',
    header: 'Deuda',
    cell: ({ row }) => {
      const d = row.original
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'text-sm font-semibold text-white truncate' }, d.name),
        h('span', { class: 'text-xs text-white/50 truncate' }, `${d.counterparty || '—'} · ${directionLabel[d.direction]}`),
      ])
    },
  },
  {
    accessorKey: 'principalAmount',
    header: () => h('div', { class: 'text-right' }, 'Principal / Vivo'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const d = row.original
      return h('div', { class: 'flex flex-col items-end min-w-0' }, [
        h('span', { class: 'text-sm font-semibold text-white whitespace-nowrap' }, formatMoney(d.principalAmount, moneda.value)),
        h('span', { class: 'text-xs text-white/50 whitespace-nowrap' }, `Vivo: ${formatMoney(d.outstanding, moneda.value)}`),
      ])
    },
  },
  {
    accessorKey: 'paidAmount',
    header: 'Avance',
    cell: ({ row }) => {
      const d = row.original
      const pct = pctAmortizado(d)
      return h('div', { class: 'flex flex-col gap-1 min-w-28' }, [
        h(UProgress, { modelValue: pct, max: 100, size: 'xs' }),
        h('span', { class: 'text-xs text-white/50' }, `${pct}% amortizado`),
      ])
    },
  },
  {
    accessorKey: 'dueDate',
    header: 'Vencimiento',
    cell: ({ row }) => {
      const d = row.original
      const vencida = isVencida(d)
      return h('div', { class: 'flex flex-col gap-1' }, [
        h('span', { class: 'text-sm text-white/80 whitespace-nowrap' }, etiquetaVencimiento(d.dueDate)),
        vencida ? h(UBadge, { color: 'error', variant: 'subtle', size: 'sm', class: 'font-semibold w-fit' }, () => 'Vencida') : null,
      ])
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const d = row.original
      if (d.status === 'paid') {
        return h(UBadge, { color: 'success', variant: 'subtle', size: 'sm', class: 'font-semibold w-fit' }, () => 'Liquidada')
      }
      if (isVencida(d)) {
        return h(UBadge, { color: 'error', variant: 'subtle', size: 'sm', class: 'font-semibold w-fit' }, () => 'Vencida')
      }
      return h(UBadge, { color: 'warning', variant: 'subtle', size: 'sm', class: 'font-semibold w-fit' }, () => 'Vigente')
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right pr-2' }, 'Acciones'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const record = row.original
      const dropdownItems = [
        [
          {
            label: 'Editar',
            icon: 'i-lucide-square-pen',
            onSelect: () => emit('edit', record),
            },
          {
            label: 'Liquidar',
            icon: 'i-lucide-badge-check',
            onSelect: () => emit('settle', record),
          },
          {
            label: 'Eliminar',
            icon: 'i-lucide-trash-2',
            color: 'error' as const,
            onSelect: () => emit('delete', record.id),
          },
        ],
      ]
      return h('div', { class: 'flex justify-end pr-1' }, [
        h(UDropdownMenu, {
          items: dropdownItems,
          content: { align: 'end' },
        }, {
          default: () => h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
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
              <UIcon name="i-lucide-circle-x" class="size-8 text-white/30" />
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
