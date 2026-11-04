<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Supplier } from '~/services/suppliers.service'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const props = defineProps<{
  data: Supplier[]
  total: number
  loading: boolean
  togglingId?: string | null
  puedeEditar?: boolean
  puedeEliminar?: boolean
}>()

const emit = defineEmits<{
  edit: [proveedor: Supplier]
  toggle: [id: string]
  delete: [id: string]
}>()

const columnas: TableColumn<Supplier>[] = [
  {
    accessorKey: 'name',
    header: 'Proveedor',
    cell: ({ row }) => {
      const p = row.original
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'text-sm font-semibold text-highlighted truncate' }, p.name),
        h('span', { class: 'text-xs text-muted truncate' }, p.contactName || 'Sin contacto'),
      ])
    },
  },
  {
    id: 'contacto',
    header: 'Contacto',
    cell: ({ row }) => {
      const p = row.original
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'text-sm text-toned truncate' }, p.phone || '—'),
        h('span', { class: 'text-xs text-muted truncate' }, p.email || '—'),
      ])
    },
  },
  {
    accessorKey: 'address',
    header: 'Dirección',
    cell: ({ row }) => h('span', { class: 'text-sm text-toned truncate max-w-64 block' }, row.original.address || '—'),
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ row }) => h(UBadge, {
      color: row.original.isActive ? 'success' : 'neutral',
      variant: 'subtle',
      size: 'sm',
      class: 'font-semibold w-fit',
    }, () => row.original.isActive ? 'Activo' : 'Inactivo'),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right pr-2' }, 'Acciones'),
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const record = row.original
      const isToggling = props.togglingId === record.id
      const items = [[
        ...(props.puedeEditar !== false
          ? [{ label: 'Editar', icon: 'i-lucide-square-pen', onSelect: () => emit('edit', record) }]
          : []),
        ...(props.puedeEditar !== false
          ? [{
              label: isToggling ? 'Procesando...' : (record.isActive ? 'Desactivar' : 'Activar'),
              icon: record.isActive ? 'i-lucide-ban' : 'i-lucide-circle-check',
              color: record.isActive ? ('error' as const) : ('success' as const),
              disabled: isToggling,
              onSelect: () => emit('toggle', record.id),
            }]
          : []),
        ...(props.puedeEliminar !== false
          ? [{ label: 'Eliminar', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => emit('delete', record.id) }]
          : []),
      ]]
      return h('div', { class: 'flex justify-end pr-1' }, [
        h(UDropdownMenu, { items, content: { align: 'end' } }, {
          default: () => h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            size: 'xs',
            loading: isToggling,
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
  return `Mostrando ${start}-${end} de ${props.total} proveedores registrados`
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
          <span class="text-sm font-bold text-highlighted tracking-wide">Gestión de Proveedores</span>
          <UBadge v-if="totalItems" size="sm" color="primary" variant="subtle" class="px-2.5 font-semibold">
            {{ totalItems }} {{ totalItems === 1 ? 'Proveedor' : 'Proveedores' }}
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
            <p class="text-sm text-muted font-medium">No hay proveedores que coincidan con los criterios.</p>
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
