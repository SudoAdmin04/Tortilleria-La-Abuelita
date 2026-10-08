
<script setup lang="ts">
const { notificaciones, total, loading, sinLeer, filters, fetchNotificaciones, marcarLeida, eliminar } = useNotificaciones()
const cols = [
  { accessorKey: 'title', header: 'Título' },
  { accessorKey: 'body', header: 'Mensaje' },
  { accessorKey: 'type', header: 'Tipo' },
  { accessorKey: 'isRead', header: 'Estado' },
  { accessorKey: 'actions', header: '' },
]

onMounted(fetchNotificaciones)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Notificaciones</h1>
        <p class="text-sm text-slate-400">{{ total }} registros · {{ sinLeer }} sin leer</p>
      </div>
      <UButton variant="ghost" color="neutral" icon="i-lucide-refresh-cw" :loading="loading" @click="fetchNotificaciones()" />
    </div>

    <UCard>
      <div class="flex gap-2 mb-4">
        <UInput v-model="filters.buscar" icon="i-lucide-search" placeholder="Buscar..." class="max-w-64" @change="fetchNotificaciones()" />
      </div>
      <UTable :data="notificaciones" :columns="cols" :loading="loading">
        <template #type-cell="{ row }"><UBadge variant="soft" :color="row.original.type === 'error' ? 'error' : row.original.type === 'warning' ? 'warning' : row.original.type === 'success' ? 'success' : 'info'">{{ row.original.type }}</UBadge></template>
        <template #isRead-cell="{ row }"><UBadge :color="row.original.isRead ? 'neutral' : 'primary'" variant="soft">{{ row.original.isRead ? 'Leída' : 'Nueva' }}</UBadge></template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton v-if="!row.original.isRead" size="xs" variant="ghost" icon="i-lucide-check" @click="marcarLeida(row.original.id)" />
            <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="eliminar(row.original.id)" />
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>




