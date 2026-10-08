<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Pantalla } from '~/services/pantallas.repository'

export type { Pantalla }

const UIcon = resolveComponent('UIcon')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const { confirm } = useConfirm()

const props = defineProps<{
  data: Pantalla[]
  loading?: boolean
  total: number
}>()

const emit = defineEmits<{
  edit: [pantalla: Pantalla]
  toggle: [id: number, activo: boolean]
}>()

const columns: TableColumn<Pantalla>[] = [
  {
    accessorKey: 'nombre',
    header: 'Pantalla',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2.5 py-1' }, [
        h('span', { class: 'font-semibold text-sm text-neutral-900 dark:text-white' }, row.original.nombre)
      ])
    }
  },
  {
    accessorKey: 'ruta',
    header: 'Ruta',
    cell: ({ row }) => h('span', { class: 'text-sm text-neutral-600 dark:text-neutral-300' }, row.original.ruta)
  },
  {
    accessorKey: 'icono',
    header: 'Icono',
    cell: ({ row }) => h('span', { class: 'text-sm text-neutral-600 dark:text-neutral-300' }, row.original.icono)
  },
  {
    accessorKey: 'orden',
    header: 'Orden',
    cell: ({ row }) => h('span', { class: 'text-sm font-medium text-neutral-700 dark:text-neutral-300' }, String(row.original.orden))
  },
  {
    accessorKey: 'activo',
    header: 'Estado',
    cell: ({ row }) => {
      const active = row.original.activo
      return h(UBadge, {
        color: active ? 'success' : 'neutral',
        variant: 'soft',
        size: 'sm'
      }, () => active ? 'Activo' : 'Inactivo')
    }
  },
  {
    id: 'actions',
    header: 'Acciones',
    meta: { class: { td: 'text-center' } },
    cell: ({ row }) => {
      const record = row.original
      const isActivo = record.activo

      return h('div', { class: 'flex items-center justify-center gap-1' }, [
        h(UTooltip, { text: 'Editar pantalla', delayDuration:0 }, () => h(UButton, {
          icon: 'i-heroicons-pencil-square',
          color: 'info',
          variant: 'soft',
          size: 'sm',
          onClick: () => emit('edit', record)
        })),

        h(UTooltip, { text: isActivo ? 'Desactivar' : 'Activar', delayDuration:0 }, () => h(UButton, {
          icon: isActivo ? 'i-heroicons-no-symbol' : 'i-heroicons-check-circle',
          color: isActivo ? 'warning' : 'success',
          variant: 'soft',
          size: 'sm',
          onClick: async () => {
            const isConfirmed = await confirm({
              title: isActivo ? '¿Desactivar?' : '¿Activar?',
              description: `¿Estás seguro de que deseas ${isActivo ? 'desactivar' : 'activar'} esta pantalla?`,
              variant: isActivo ? 'warning' : 'save',
              confirmText: isActivo ? 'Sí, desactivar' : 'Sí, activar',
              cancelText: 'Cancelar'
            })

            if (isConfirmed) {
              emit('toggle', record.id, record.activo)
            }
          }
        })),
      ])
    }
  }
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
  if (!props.data.length) return '0 registros'
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, props.data.length)
  return `Mostrando ${start}-${end} de ${props.data.length} registros`
})
</script>

<template>
  <UCard class="flex-1 flex flex-col max-h-[calc(100vh-250px)]" :ui="{ body: 'p-0 overflow-auto', footer: 'py-3 px-4 border-t border-default' }">
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-computer-desktop" class="size-5 text-primary" />
          <span class="text-sm font-semibold">Pantallas del Catálogo</span>
          <UBadge v-if="data.length" size="sm" color="primary" variant="subtle">{{totalItems}}</UBadge>
        </div>
      </div>
    </template>

    <template #default>
      <UTable
        :data="props.data"
        :loading="props.loading"
        :columns="columns"
        sticky
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 gap-3">
            <UIcon name="i-heroicons-computer-desktop" class="size-8 text-neutral-400" />
            <p class="text-sm text-neutral-500 font-medium">No se encontraron pantallas en el sistema.</p>
          </div>
        </template>
      </UTable>
    </template>

    <template #footer>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400">{{ pageLabel }}</span>

        <div class="flex items-center gap-2">
          <USelect v-model="itemsPerPage" :items="pageCountOptions" class="w-20" />
          <UPagination 
            v-if="props.total > 0" 
            v-model:page="page" 
            :items-per-page="itemsPerPage" 
            :total="props.total" 
            size="sm" 
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
