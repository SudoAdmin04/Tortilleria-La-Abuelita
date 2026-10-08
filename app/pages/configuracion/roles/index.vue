

<script setup lang="ts">
import type { Role } from '~/services/roles.service'

const { items, loading, total, filter, fetchPaginado, create, update, remove } = useRoles()
const drawer = ref(false)
const editId = ref<number | null>(null)
const form = reactive({ name: '', description: '', isAdmin: false, isActive: true })
const cols = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'description', header: 'Descripción' },
  { accessorKey: 'isAdmin', header: 'Tipo' },
  { accessorKey: 'isActive', header: 'Estado' },
  { accessorKey: 'actions', header: '' },
]

function abrirCrear() {
  editId.value = null
  Object.assign(form, { name: '', description: '', isAdmin: false, isActive: true })
  drawer.value = true
}

function abrirEditar(r: Role) {
  editId.value = r.id
  Object.assign(form, { name: r.name, description: r.description || '', isAdmin: r.isAdmin, isActive: r.isActive })
  drawer.value = true
}

async function guardar() {
  if (editId.value) await update(String(editId.value), { name: form.name, description: form.description || undefined, isAdmin: form.isAdmin, isActive: form.isActive })
  else await create({ name: form.name, description: form.description || undefined, isAdmin: form.isAdmin, isActive: form.isActive })
  drawer.value = false
}

onMounted(fetchPaginado)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Roles</h1>
        <p class="text-sm text-slate-400">{{ total }} roles</p>
      </div>
      <UButton icon="i-lucide-plus" @click="abrirCrear()">Nuevo rol</UButton>
    </div>

    <UCard>
      <UTable :data="items" :columns="cols" :loading="loading">
        <template #isAdmin-cell="{ row }"><UBadge :color="row.original.isAdmin ? 'primary' : 'neutral'" variant="soft">{{ row.original.isAdmin ? 'Admin' : 'Operativo' }}</UBadge></template>
        <template #isActive-cell="{ row }"><UBadge :color="row.original.isActive ? 'success' : 'neutral'" variant="soft">{{ row.original.isActive ? 'Activo' : 'Inactivo' }}</UBadge></template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton size="xs" variant="ghost" icon="i-lucide-pencil" @click="abrirEditar(row.original)" />
            <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(row.original.id)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <USlideover v-model:open="drawer" title="Rol">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="guardar">
          <UFormField label="Nombre" required><UInput v-model="form.name" class="w-full" /></UFormField>
          <UFormField label="Descripción"><UInput v-model="form.description" class="w-full" /></UFormField>
          <UFormField label="Es admin"><USwitch v-model="form.isAdmin" /></UFormField>
          <UFormField label="Activo"><USwitch v-model="form.isActive" /></UFormField>
          <UButton type="submit" block>Guardar</UButton>
        </UForm>
      </template>
    </USlideover>
  </div>
</template>



