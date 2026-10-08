<script setup lang="ts">
import { h, computed, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { BitacoraAcceso } from '~/services/bitacora-accesos.repository'

const UBadge = resolveComponent('UBadge')

const props = defineProps<{
  data: BitacoraAcceso[]
  total: number
  loading?: boolean
}>()

function fechaHora(iso: string): { fecha: string; hora: string } {
  try {
    const d = new Date(iso)
    return {
      fecha: formatDate(iso),
      hora: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    }
  } catch {
    return { fecha: iso, hora: '—' }
  }
}

const columns: TableColumn<BitacoraAcceso>[] = [
  {
    accessorKey: 'usuario',
    header: 'Usuario',
    cell: ({ row }) => h('span', { class: 'text-sm font-medium' }, row.original.usuario.nombreUsuario)
  },
  {
    accessorKey: 'correo',
    header: 'Correo Electrónico',
    cell: ({ row }) => h(
      'span',
      { class: 'text-sm text-neutral-600 dark:text-neutral-300' },
      row.original.usuario.correo
    )
  },
  {
    accessorKey: 'acceso',
    header: 'Acceso',
    cell: ({ row }) => h(UBadge, {
      color: row.original.acceso ? 'success' : 'error',
      variant: 'soft',
      size: 'sm'
    }, () => row.original.acceso ? 'Autorizado' : 'Denegado')
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => h(
      'span',
      { class: 'text-sm text-neutral-600 dark:text-neutral-300 max-w-md block truncate' },
      row.original.descripcion
    )
  },
  {
    accessorKey: 'fechaCreacion',
    header: 'Fecha',
    cell: ({ row }) => h('span', { class: 'text-sm whitespace-nowrap' }, fechaHora(row.original.fechaCreacion).fecha)
  },
  {
    id: 'hora',
    header: 'Hora',
    cell: ({ row }) => h('span', { class: 'text-sm whitespace-nowrap' }, fechaHora(row.original.fechaCreacion).hora)
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
          <UIcon name="i-heroicons-clock" class="size-5 text-primary" />
          <span class="text-sm font-semibold">Historial de Accesos</span>
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
          <div v-if="!props.loading" class="flex flex-col items-center justify-center py-12 gap-3">
            <UIcon name="i-heroicons-clock" class="size-8 text-neutral-400" />
            <p class="text-sm text-neutral-500 font-medium">No hay accesos que coincidan con los criterios.</p>
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
