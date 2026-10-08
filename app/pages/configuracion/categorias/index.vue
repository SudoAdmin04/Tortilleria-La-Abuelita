
<script setup lang="ts">
import { listCategories, createCategory, updateCategory, deleteCategory, type Category } from '~/services/categories.service'
import { getApiMessage } from '~/utils/api-error'

const permisos = usePermisosStore()
const toast = useToast()
const puedeCrear = computed(() => permisos.can('/configuracion/categorias', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/configuracion/categorias', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/configuracion/categorias', 'canDelete'))

const rows = ref<any[]>([])
const loading = ref(false)
const drawer = ref(false)
const saving = ref(false)
const tree = ref(true)
const editId = ref<string | null>(null)
const rubrosOpts = ref<{ value: string; label: string }[]>([])
const form = reactive({ name: '', kind: 'expense', parentId: '', color: '#3b82f6', isActive: true })
const cols = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'kind', header: 'Tipo' },
  { accessorKey: 'isActive', header: 'Estado' },
  { accessorKey: 'actions', header: '' },
]

async function recargar() {
  loading.value = true
  try {
    const res: any = await listCategories(tree.value)
    if (tree.value && Array.isArray(res) && res[0]?.children !== undefined) {
      const flat: any[] = []
      for (const r of res) {
        flat.push(r)
        for (const c of r.children || []) flat.push({ ...c, name: `— ${c.name}` })
      }
      rows.value = flat
      rubrosOpts.value = res.map((r: any) => ({ value: r.id, label: r.name }))
    } else {
      rows.value = res
      rubrosOpts.value = (res as Category[]).filter(c => !c.parentId).map(c => ({ value: c.id, label: c.name }))
    }
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar'), color: 'error' })
  } finally {
    loading.value = false
  }
}

function abrirCrear() {
  editId.value = null
  Object.assign(form, { name: '', kind: 'expense', parentId: '', color: '#3b82f6', isActive: true })
  drawer.value = true
}

function abrirEditar(row: any) {
  editId.value = row.original.id
  Object.assign(form, { name: row.original.name.replace(/^— /, ''), kind: row.original.kind, parentId: row.original.parentId || '', color: row.original.color || '#3b82f6', isActive: row.original.isActive })
  drawer.value = true
}

async function guardar() {
  saving.value = true
  try {
    if (editId.value) {
      await updateCategory(editId.value, { name: form.name, color: form.color, isActive: form.isActive, sortOrder: 0 })
    } else {
      await createCategory({ name: form.name, kind: form.parentId ? undefined : (form.kind as any), parentId: form.parentId || undefined, color: form.color, sortOrder: 0 })
    }
    toast.add({ title: 'Guardado', color: 'success' })
    drawer.value = false
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo guardar'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function eliminar(row: any) {
  try {
    await deleteCategory(row.original.id)
    toast.add({ title: 'Eliminada', color: 'success' })
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'Si está en uso, desactívala'), color: 'error' })
  }
}

onMounted(recargar)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Categorías</h1>
        <p class="text-sm text-slate-400">Rubros y partidas · máximo 2 niveles</p>
      </div>
      <div class="flex gap-2">
        <USwitch v-model="tree" label="Vista árbol" @update:model-value="recargar()" />
        <UButton v-if="puedeCrear" icon="i-lucide-plus" @click="abrirCrear()">Nueva</UButton>
      </div>
    </div>

    <UCard>
      <UTable :data="rows" :columns="cols" :loading="loading">
        <template #kind-cell="{ row }"><UBadge variant="soft" color="neutral">{{ row.original.kind }}</UBadge></template>
        <template #isActive-cell="{ row }"><UBadge :color="row.original.isActive ? 'success' : 'neutral'" variant="soft">{{ row.original.isActive ? 'Activa' : 'Inactiva' }}</UBadge></template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton v-if="puedeEditar" size="xs" variant="ghost" icon="i-lucide-pencil" @click="abrirEditar(row.original)" />
            <UButton v-if="puedeEliminar" size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="eliminar(row.original)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <USlideover v-model:open="drawer" title="Categoría">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="guardar">
          <UFormField label="Nombre" required><UInput v-model="form.name" class="w-full" /></UFormField>
          <UFormField v-if="!editId" label="Naturaleza (solo rubros)">
            <USelect v-model="form.kind" :items="['income', 'expense', 'savings', 'debt'].map(k => ({ value: k, label: k }))" class="w-full" />
          </UFormField>
          <UFormField label="Rubro padre (vacío = rubro)">
            <USelect v-model="form.parentId" :items="[{ value: '', label: '— Es rubro —' }, ...rubrosOpts]" class="w-full" />
          </UFormField>
          <UFormField label="Color"><UInput v-model="form.color" type="color" class="w-full" /></UFormField>
          <UFormField v-if="editId" label="Activa"><USwitch v-model="form.isActive" /></UFormField>
          <UButton type="submit" block :loading="saving">{{ editId ? 'Actualizar' : 'Crear' }}</UButton>
        </UForm>
      </template>
    </USlideover>
  </div>
</template>



