
<script setup lang="ts">
import type { Screen } from '~/services/screens.service'

const { items, loading, total, filters, fetchPaginado, create, update, toggleActivo, remove } = usePantallas()
const drawer = ref(false)
const editId = ref<number | null>(null)
const form = reactive({ name: '', path: '', icon: '', order: 0, module: 'finanzas', isActive: true })
const cols = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'path', header: 'Ruta' },
  { accessorKey: 'module', header: 'Módulo' },
  { accessorKey: 'isActive', header: 'Estado' },
  { accessorKey: 'actions', header: '' },
]

function abrirCrear() {
  editId.value = null
  Object.assign(form, { name: '', path: '', icon: '', order: 0, module: 'finanzas', isActive: true })
  drawer.value = true
}

function abrirEditar(s: Screen) {
  editId.value = s.id
  Object.assign(form, { name: s.name, path: s.path || '', icon: s.icon || '', order: s.order || 0, module: s.module || 'finanzas', isActive: s.isActive })
  drawer.value = true
}

async function guardar() {
  const payload: any = { name: form.name, path: form.path || undefined, icon: form.icon || undefined, order: Number(form.order), module: form.module || undefined, isActive: form.isActive }
  if (editId.value) await update(editId.value, payload)
  else await create(payload)
  drawer.value = false
}

onMounted(fetchPaginado)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Pantallas</h1>
        <p class="text-sm text-slate-400">{{ total }} pantallas · viajan en el JWT como permisos</p>
      </div>
      <UButton icon="i-lucide-plus" @click="abrirCrear()">Nueva pantalla</UButton>
    </div>

    <UCard>
      <div class="flex gap-2 mb-4">
        <UInput v-model="filters.buscar" icon="i-lucide-search" placeholder="Buscar..." class="max-w-64" @change="fetchPaginado()" />
      </div>
      <UTable :data="items" :columns="cols" :loading="loading">
        <template #isActive-cell="{ row }"><UBadge :color="row.original.isActive ? 'success' : 'neutral'" variant="soft">{{ row.original.isActive ? 'Activa' : 'Inactiva' }}</UBadge></template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton size="xs" variant="ghost" icon="i-lucide-pencil" @click="abrirEditar(row.original)" />
            <UButton size="xs" variant="ghost" :icon="row.original.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="toggleActivo(row.original.id, !row.original.isActive)" />
            <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(row.original.id)" />
          </div>
        </template>
      </UTable>
      <UPagination v-model="filters.pagina" :total="total" :per-page="filters.registros" class="mt-4" @update:model-value="fetchPaginado()" />
    </UCard>

    <USlideover v-model:open="drawer" title="Pantalla">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="guardar">
          <UFormField label="Nombre" required><UInput v-model="form.name" class="w-full" /></UFormField>
          <UFormField label="Ruta"><UInput v-model="form.path" placeholder="/dashboard" class="w-full" /></UFormField>
          <UFormField label="Icono"><UInput v-model="form.icon" placeholder="i-lucide-..." class="w-full" /></UFormField>
          <UFormField label="Orden"><UInput v-model="form.order" type="number" class="w-full" /></UFormField>
          <UFormField label="Módulo"><UInput v-model="form.module" placeholder="finanzas|sistema|catalogos" class="w-full" /></UFormField>
          <UFormField label="Activa"><USwitch v-model="form.isActive" /></UFormField>
          <UButton type="submit" block>Guardar</UButton>
        </UForm>
      </template>
    </USlideover>
  </div>
</template>




