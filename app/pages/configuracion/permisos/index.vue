<script setup lang="ts">
import type { RoleScreen } from '~/services/role-screens.service'

const { items, total, loading, fetchPaginado, remove, filter } = useRolePermissions()
const { items: roles, fetchAll: fetchRoles } = useRoles()
const { items: pantallas, fetchAll: fetchPantallas } = usePantallas()

const search = ref('')
const formDrawerOpen = ref(false)
const editingPermiso = ref<RoleScreen | null>(null)
const page = ref(1)
const pageCount = ref(10)

let searchTimer: ReturnType<typeof setTimeout> | undefined

watch([page, pageCount], () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  fetchPaginado()
})

watch(search, (v) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    filter.pagina = 1
    filter.buscar = v?.trim() ? v.trim() : undefined
    fetchPaginado()
  }, 350)
})

function openCreate() {
  editingPermiso.value = null
  formDrawerOpen.value = true
}

function openEdit(permiso: RoleScreen) {
  editingPermiso.value = permiso
  formDrawerOpen.value = true
}

async function handleDelete(id: number) {
  await remove(id)
}

onMounted(async () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  await Promise.all([fetchPaginado(), fetchRoles(), fetchPantallas()])
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Permisos"
      description="Gestiona el acceso rol × pantalla del sistema"
      search-placeholder="Buscar permiso..."
      create-label="Asignar Permiso"
      @create="openCreate"
    />

    <ConfiguracionPermisosTable
      :data="items"
      :loading="loading"
      :total="total"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @edit="openEdit"
      @delete="handleDelete"
    />

    <ConfiguracionPermisosDrawer
      v-model:open="formDrawerOpen"
      :permiso="editingPermiso"
      :roles="roles"
      :pantallas="pantallas"
      @refresh="fetchPaginado"
    />
  </div>
</template>
