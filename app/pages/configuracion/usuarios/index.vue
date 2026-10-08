<script setup lang="ts">
import { listRoles, type Role } from '~/services/roles.service'

const { filtered, loading, filter, fetchAll, assignRole } = useUsuarios()
const roles = ref<Role[]>([])
const cols = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'email', header: 'Correo' },
  { accessorKey: 'isAdmin', header: 'Rol' },
  { accessorKey: 'isActive', header: 'Estado' },
  { accessorKey: 'actions', header: 'Asignar rol' },
]

onMounted(async () => {
  await fetchAll()
  roles.value = await listRoles()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Usuarios</h1>
        <p class="text-sm text-slate-400">Solo admin · el cambio de rol aplica en el próximo login</p>
      </div>
      <UInput v-model="filter.buscar" icon="i-lucide-search" placeholder="Buscar..." class="max-w-64" />
    </div>

    <UCard>
      <UTable :data="filtered" :columns="cols" :loading="loading">
        <template #isAdmin-cell="{ row }"><UBadge :color="row.original.isAdmin ? 'primary' : 'neutral'" variant="soft">{{ row.original.isAdmin ? 'Admin' : row.original.role || '—' }}</UBadge></template>
        <template #isActive-cell="{ row }"><UBadge :color="row.original.isActive ? 'success' : 'neutral'" variant="soft">{{ row.original.isActive ? 'Activo' : 'Inactivo' }}</UBadge></template>
        <template #actions-cell="{ row }">
          <USelect
            :model-value="roles.find(r => r.name === row.original.role)?.id"
            :items="roles.map(r => ({ value: r.id, label: r.name }))"
            placeholder="Asignar rol"
            class="w-44"
            @update:model-value="(v: number) => assignRole(row.original.id, v)"
          />
        </template>
      </UTable>
    </UCard>
  </div>
</template>





