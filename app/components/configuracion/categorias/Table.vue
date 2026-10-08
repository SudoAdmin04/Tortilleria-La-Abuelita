<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { CategoriaRow } from '~/composables/useCategorias'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const props = defineProps<{
  data: CategoriaRow[]
  total: number
  loading: boolean
  /** id de la categoría en proceso de activar/desactivar (viene de `useCategorias.toggleActivo` en el padre) */
  togglingId?: string | null
}>()

const emit = defineEmits<{
  edit: [categoria: CategoriaRow]
  toggle: [id: string]
  delete: [id: string]
}>()

const kindColor: Record<string, 'success' | 'primary' | 'warning' | 'error' | 'neutral'> = {
  income: 'success',
  expense: 'error',
  savings: 'primary',
  debt: 'warning',
}

const columnas: TableColumn<CategoriaRow>[] = [
  {
    accessorKey: 'displayName',
    header: 'Categoría',
    cell: ({ row }) => h('div', { class: 'flex flex-col min-w-0' }, [
      h('span', { class: 'text-sm font-semibold text-white truncate' }, row.original.displayName),
      h('span', { class: 'text-xs text-white/50 truncate' }, row.original.isRubro ? 'Rubro' : 'Partida'),
    ]),
  },
  {
    accessorKey: 'kind',
    header: 'Naturaleza',
    cell: ({ row }) => h(UBadge, {
      color: kindColor[row.original.kind] || 'neutral',
      variant: 'subtle',
      size: 'sm',
      class: 'capitalize font-medium',
    }, () => row.original.kind),
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ row }) => {
      const active = row.original.isActive
      return h(UBadge, {
        color: active ? 'success' : 'neutral',
        variant: 'subtle',
        size: 'sm',
        class: 'font-medium',
      }, () => active ? 'Activa' : 'Inactiva')
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right pr-2' }, 'Acciones'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const record = row.original
      const isActivo = record.isActive
      const isToggling = props.togglingId === record.id
      const dropdownItems = [
        [
          {
            label: 'Editar',
            icon: 'i-heroicons-pencil-square',
            onSelect: () => emit('edit', record),
          },
          {
            label: isToggling ? 'Procesando...' : (isActivo ? 'Desactivar' : 'Activar'),
            icon: isActivo ? 'i-heroicons-no-symbol' : 'i-heroicons-check-circle',
            color: isActivo ? ('error' as const) : ('success' as const),
            disabled: isToggling,
            onSelect: () => emit('toggle', record.id),
          },
          {
            label: 'Eliminar',
            icon: 'i-heroicons-trash',
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
            icon: 'i-heroicons-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            size: 'xs',
            loading: isToggling,
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
  return `Mostrando ${start}-${end} de ${props.total} categorías registradas`
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
            <span class="text-sm font-bold text-white tracking-wide">Gestión de Categorías</span>
          </div>
          <UBadge v-if="totalItems" size="sm" color="primary" variant="subtle" class="px-2.5 font-semibold">
            {{ totalItems }} {{ totalItems === 1 ? 'Categoría' : 'Categorías' }}
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
              <p class="text-sm text-white/50 font-medium">No hay categorías que coincidan con los criterios.</p>
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
