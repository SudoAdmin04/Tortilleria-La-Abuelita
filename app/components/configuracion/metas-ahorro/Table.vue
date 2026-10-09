<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { GoalProgress } from '~/services/savings-goals.service'
import { formatMoney } from '~/utils/format'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UProgress = resolveComponent('UProgress')

const props = defineProps<{
  data: GoalProgress[]
  total: number
  loading: boolean
  currency?: string
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

const columnas: TableColumn<GoalProgress>[] = [
  {
    accessorKey: 'goal',
    header: 'Meta',
    cell: ({ row }) => h('div', { class: 'flex flex-col min-w-0' }, [
      h('span', { class: 'text-sm font-semibold text-white truncate' }, row.original.goal.name),
      h('span', { class: 'text-xs text-white/50 truncate' }, `Objetivo: ${row.original.goal.targetAmount != null ? formatMoney(row.original.goal.targetAmount, props.currency || 'MXN') : '—'}`),
    ]),
  },
  {
    accessorKey: 'contributed',
    header: 'Avance del mes',
    cell: ({ row }) => h('div', { class: 'flex flex-col min-w-0' }, [
      h('span', { class: 'text-sm font-semibold text-white' }, `${formatMoney(row.original.contributed, props.currency || 'MXN')} de ${formatMoney(row.original.monthlyTarget, props.currency || 'MXN')}`),
      h('span', { class: 'text-xs text-white/50' }, `Histórico: ${formatMoney(row.original.totalContributed, props.currency || 'MXN')}`),
    ]),
  },
  {
    accessorKey: 'percent',
    header: '% Mes',
    cell: ({ row }) => {
      const pct = row.original.percent ?? 0
      return h('div', { class: 'flex flex-col gap-1 min-w-28' }, [
        h(UProgress, { value: Math.min(100, Math.round(pct)), size: 'xs' }),
        h(UBadge, {
          color: pct >= 100 ? 'success' : 'primary',
          variant: 'subtle',
          size: 'sm',
          class: 'font-semibold w-fit',
        }, () => `${row.original.percent ?? '—'}%`),
      ])
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
            onSelect: () => emit('edit', record.goal.id),
          },
          {
            label: 'Eliminar',
            icon: 'i-lucide-trash-2',
            color: 'error' as const,
            onSelect: () => emit('delete', record.goal.id),
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
  return `Mostrando ${start}-${end} de ${props.total} metas registradas`
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
            <span class="text-sm font-bold text-white tracking-wide">Gestión de Metas de Ahorro</span>
          </div>
          <UBadge v-if="totalItems" size="sm" color="primary" variant="subtle" class="px-2.5 font-semibold">
            {{ totalItems }} {{ totalItems === 1 ? 'Meta' : 'Metas' }}
          </UBadge>
        </div>
      </template>

      <template #default>
        <UTable
          data-key="goal.id"
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
              <p class="text-sm text-white/50 font-medium">No hay metas que coincidan con los criterios.</p>
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
