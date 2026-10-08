<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { components } from '~/types/api'

type Rol = components['schemas']['Rol']

const UIcon = resolveComponent('UIcon')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const { confirm } = useConfirm()

const props = defineProps<{
  data: Rol[]
  total: number
  loading?: boolean
}>()

const emit = defineEmits<{
  edit: [rol: Rol]
  toggle: [id: string]
}>()

const columns: TableColumn<Rol>[] = [
  {
    accessorKey: 'descripcion',
    header: 'Rol',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2.5 py-1' }, [
        h('span', { class: 'font-semibold text-sm text-neutral-900 dark:text-white' }, row.original.descripcion)
      ])
    }
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
        h(UTooltip, { text: 'Editar rol', delayDuration:0 }, () => h(UButton, {
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
              title: isActivo ? '¿Desactivar rol?' : '¿Activar rol?',
              description: `¿Estás seguro de que deseas ${isActivo ? 'desactivar' : 'activar'}?`,
              variant: isActivo ? 'warning' : 'save',
              confirmText: isActivo ? 'Sí, desactivar' : 'Sí, activar',
              cancelText: 'Cancelar'
            })

            if (isConfirmed) {
              emit('toggle',  String(record.id))
            }
          }
        })),
      ])
    }
  }
]

const pageCountOptions = [5, 10, 25]
const page = defineModel<number>('page', { default: 10 })
const itemsPerPage = defineModel<number>('pageCount', { default: 10 })
const totalItems = computed(() => props.total ?? props.data.length)

const pageLabel = computed(() => {
  if (!props.total) return '0 registros'
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, props.total)
  return `Mostrando ${start}-${end} de ${props.total} registros`
})
</script>

<template>
  <UCard class="flex-1 flex flex-col max-h-[calc(100vh-250px)]" :ui="{ body: 'p-0 overflow-auto', footer: 'py-3 px-4 border-t border-default' }">
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-lock-closed" class="size-5 text-primary" />
          <span class="text-sm font-semibold">Roles Registrados</span>
          <UBadge v-if="data.length" size="sm" color="primary" variant="subtle">{{ totalItems }}</UBadge>
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
            <UIcon name="i-heroicons-lock-closed" class="size-8 text-neutral-400" />
            <p class="text-sm text-neutral-500 font-medium">No se encontraron roles en el sistema.</p>
          </div>
        </template>
      </UTable>
    </template>

    <template #footer>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400">{{ pageLabel }}</span>

        <div class="flex items-center gap-2">
          <USelect v-model="itemsPerPage" :items="pageCountOptions" class="w-20" />
          <UPagination v-if="props.total >= itemsPerPage || page > 1" v-model:page="page" :page-size="pageCount" :items-per-page="itemsPerPage" :total="props.total" size="sm" />
        </div>
      </div>
    </template>
  </UCard>
</template>
