<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { GoalProgress } from '~/services/savings-goals.service'
import { formatMoney, formatExecution } from '~/utils/format'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UProgress = resolveComponent('UProgress')
const UTooltip = resolveComponent('UTooltip')

export interface CatalogoOpt { value: string; label: string }

const props = defineProps<{
  data: GoalProgress[]
  total: number
  loading: boolean
  currency?: string
  cuentas?: CatalogoOpt[]
  categorias?: CatalogoOpt[]
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
  deposit: [id: string]
  withdraw: [id: string]
  history: [id: string]
}>()

const moneda = computed(() => props.currency || 'MXN')
const cuentaMap = computed(() => new Map((props.cuentas ?? []).map(c => [c.value, c.label])))
const categoriaMap = computed(() => new Map((props.categorias ?? []).map(c => [c.value, c.label])))

const columnas: TableColumn<GoalProgress>[] = [
  {
    accessorKey: 'goal',
    header: 'Meta',
    cell: ({ row }) => {
      const g = row.original.goal
      const aportado = row.original.totalContributed ?? 0
      const target = g.targetAmount
      const completada = target != null && aportado >= target
      const cuenta = g.accountId ? cuentaMap.value.get(g.accountId) : undefined
      const categoria = g.categoryId ? categoriaMap.value.get(g.categoryId) : undefined
      const sub = [
        target != null ? `Objetivo: ${formatMoney(target, moneda.value)}` : 'Sin objetivo total',
        cuenta ? ` · ${cuenta}` : '',
        categoria ? ` · ${categoria}` : '',
      ].join('')
      const children: any[] = [
        h('div', { class: 'flex items-center gap-2 min-w-0' }, [
          h('span', { class: 'text-sm font-semibold text-highlighted truncate' }, g.name),
          completada ? h(UBadge, { color: 'success', variant: 'subtle', size: 'sm' }, () => 'Completada') : null,
          g.isActive ? null : h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () => 'Inactiva'),
        ]),
        h('span', { class: 'text-xs text-muted truncate' }, sub),
      ]
      return h('div', { class: 'flex flex-col min-w-0 gap-0.5' }, children)
    },
  },
  {
    accessorKey: 'contributed',
    header: 'Avance del mes',
    cell: ({ row }) => {
      const p = row.original
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'text-sm font-semibold text-highlighted' }, `${formatMoney(p.contributed, moneda.value)} de ${formatMoney(p.monthlyTarget, moneda.value)}`),
        h('span', { class: 'text-xs text-muted' }, `Faltan ${formatMoney(p.remaining, moneda.value)}`),
      ])
    },
  },
  {
    accessorKey: 'percent',
    header: '% Mes',
    cell: ({ row }) => {
      const pct = row.original.percent
      const num = Number(pct)
      const val = Number.isFinite(num) ? Math.min(100, Math.max(0, Math.round(num))) : 0

      return h('div', { class: 'flex flex-col gap-1 min-w-28' }, [
        h(UProgress, { modelValue: val, max: 100, size: 'xs' }),
        h(UBadge, {
          color: pct == null || Number.isNaN(num) ? 'neutral' : num >= 100 ? 'success' : 'primary',
          variant: 'subtle',
          size: 'sm',
          class: 'font-semibold w-fit',
        }, () => formatExecution(pct)),
      ])
    },
  },
  {
    accessorKey: 'totalContributed',
    header: 'Progreso a la meta',
    cell: ({ row }) => {
      const p = row.original
      const target = p.goal.targetAmount
      const aportado = p.totalContributed ?? 0
      
      const rawPct = p.targetProgressPercent ?? (target != null && target > 0 ? (aportado / target) * 100 : null)
      const numPct = Number(rawPct)
      
      const val = Number.isFinite(numPct) ? Math.min(100, Math.max(0, Math.round(numPct))) : 0
      
      const completada = target != null && aportado >= target
      const faltante = target != null ? Math.max(target - aportado, 0) : null

      return h('div', { class: 'flex flex-col gap-1 min-w-36' }, [
        h('span', { class: 'text-sm font-semibold text-highlighted' },
          target != null
            ? `${formatMoney(aportado, moneda.value)} de ${formatMoney(target, moneda.value)}`
            : formatMoney(aportado, moneda.value)),
        h(UProgress, { modelValue: target != null ? val : 0, max: 100, size: 'sm' }),
        h('div', { class: 'flex items-center gap-1.5 flex-wrap' }, [
          completada
            ? h(UBadge, { color: 'success', variant: 'subtle', size: 'sm', class: 'font-semibold w-fit' }, () => 'Completada')
            : h(UBadge, {
                color: rawPct == null || Number.isNaN(numPct) ? 'neutral' : numPct >= 100 ? 'success' : 'primary',
                variant: 'subtle',
                size: 'sm',
                class: 'font-semibold w-fit',
              }, () => formatExecution(rawPct)),
          target != null && !completada
            ? h('span', { class: 'text-xs text-muted' }, `Faltan ${formatMoney(faltante, moneda.value)}`)
            : null,
          target == null
            ? h('span', { class: 'text-xs text-muted' }, 'Sin objetivo total')
            : null,
        ]),
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
            label: 'Aportar Saldo',
            icon: 'i-lucide-plus-circle',
            onSelect: () => emit('deposit', record.goal.id),
          },
          {
            label: 'Retirar saldo',
            icon: 'i-lucide-minus-circle',
            onSelect: () => emit('withdraw', record.goal.id),
          },
          {
            label: 'Ver historial',
            icon: 'i-lucide-history',
            onSelect: () => emit('history', record.goal.id),
          },
        ],
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
      return h('div', { class: 'flex justify-end items-center gap-1 pr-1' }, [
        h(UTooltip, { text: 'Agregar' }, () =>
          h(UButton, {
            icon: 'i-lucide-plus',
            color: 'neutral',
            variant: 'soft',
            size: 'xs',
            class: 'text-muted hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg',
            'aria-label': `Aportar a ${record.goal.name}`,
            onClick: (e: Event) => { e.stopPropagation(); emit('deposit', record.goal.id) },
          })
        ),
        h(UTooltip, { text: 'Retirar' }, () =>
          h(UButton, {
            icon: 'i-lucide-minus',
            color: 'neutral',
            variant: 'soft',
            size: 'xs',
            class: 'text-muted hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 rounded-lg',
            'aria-label': `Retirar de ${record.goal.name}`,
            onClick: (e: Event) => { e.stopPropagation(); emit('withdraw', record.goal.id) },
          })
        ),
        h(UDropdownMenu, {
          items: dropdownItems,
          content: { align: 'end' },
        }, {
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
            <span class="text-sm font-bold text-highlighted tracking-wide">Gestión de Metas de Ahorro</span>
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
          :ui="{ tr: 'hover:bg-elevated/50 transition-colors duration-150 cursor-pointer'}"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center py-12 gap-3">
              <UIcon name="i-lucide-circle-x" class="size-8 text-dimmed" />
              <p class="text-sm text-muted font-medium">No hay metas que coincidan con los criterios.</p>
            </div>
          </template>
        </UTable>
      </template>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span class="text-muted font-medium">
            {{ pageLabel }}
          </span>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-muted">Filas por página:</span>
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
