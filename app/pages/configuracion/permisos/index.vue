
<script setup lang="ts">
import { listRoles, type Role } from '~/services/roles.service'
import { listScreens, type Screen } from '~/services/screens.service'
import type { RoleScreen } from '~/services/role-screens.service'


const { items, loading, total, fetchPaginado, create, update, remove } = useRolePermissions()
const roles = ref<Role[]>([])
const screens = ref<Screen[]>([])
const drawer = ref(false)
const editId = ref<number | null>(null)
const form = reactive({ roleId: 0 as number, screenId: 0 as number, canRead: true, canCreate: false, canUpdate: false, canDelete: false })
const cols = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'canRead', header: 'R' },
  { accessorKey: 'canCreate', header: 'C' },
  { accessorKey: 'canUpdate', header: 'U' },
  { accessorKey: 'canDelete', header: 'D' },
  { accessorKey: 'actions', header: '' },
]

function abrirCrear() {
  editId.value = null
  Object.assign(form, { roleId: roles.value[0]?.id || 0, screenId: screens.value[0]?.id || 0, canRead: true, canCreate: false, canUpdate: false, canDelete: false })
  drawer.value = true
}

function abrirEditar(r: RoleScreen) {
  editId.value = r.id
  Object.assign(form, { roleId: (r as any).roleId || 0, screenId: (r as any).screenId || 0, canRead: r.canRead, canCreate: r.canCreate, canUpdate: r.canUpdate, canDelete: r.canDelete })
  drawer.value = true
}

async function guardar() {
  const payload = { roleId: Number(form.roleId), screenId: Number(form.screenId), canRead: form.canRead, canCreate: form.canCreate, canUpdate: form.canUpdate, canDelete: form.canDelete }
  if (editId.value) await update(editId.value, payload)
  else await create(payload)
  drawer.value = false
}

onMounted(async () => {
  await fetchPaginado()
  roles.value = await listRoles()
  screens.value = await listScreens()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Permisos</h1>
        <p class="text-sm text-slate-400">Rol × pantalla · {{ total }} asignaciones</p>
      </div>
      <UButton icon="i-lucide-plus" @click="abrirCrear()">Asignar permiso</UButton>
    </div>

    <UCard>
      <UTable :data="items" :columns="cols" :loading="loading">
        <template #canRead-cell="{ row }"><UBadge :color="row.original.canRead ? 'success' : 'neutral'" variant="soft">R</UBadge></template>
        <template #canCreate-cell="{ row }"><UBadge :color="row.original.canCreate ? 'success' : 'neutral'" variant="soft">C</UBadge></template>
        <template #canUpdate-cell="{ row }"><UBadge :color="row.original.canUpdate ? 'success' : 'neutral'" variant="soft">U</UBadge></template>
        <template #canDelete-cell="{ row }"><UBadge :color="row.original.canDelete ? 'success' : 'neutral'" variant="soft">D</UBadge></template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton size="xs" variant="ghost" icon="i-lucide-pencil" @click="abrirEditar(row.original)" />
            <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(row.original.id)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <USlideover v-model:open="drawer" title="Permiso rol × pantalla">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="guardar">
          <UFormField label="Rol" required>
            <USelect v-model="form.roleId" :items="roles.map(r => ({ value: r.id, label: r.name }))" class="w-full" />
          </UFormField>
          <UFormField label="Pantalla" required>
            <USelect v-model="form.screenId" :items="screens.map(s => ({ value: s.id, label: s.name }))" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-2">
            <UFormField label="Leer"><USwitch v-model="form.canRead" /></UFormField>
            <UFormField label="Crear"><USwitch v-model="form.canCreate" /></UFormField>
            <UFormField label="Editar"><USwitch v-model="form.canUpdate" /></UFormField>
            <UFormField label="Eliminar"><USwitch v-model="form.canDelete" /></UFormField>
          </div>
          <UButton type="submit" block>Guardar</UButton>
        </UForm>
      </template>
    </USlideover>
  </div>
</template>



