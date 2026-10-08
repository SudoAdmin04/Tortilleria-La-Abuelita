<script setup lang="ts">
import type { Role } from '~/services/roles.service'

const { items, total, loading, fetchPaginado, toggleActivo, remove, filter } = useRoles()

const search = ref('')
const formDrawerOpen = ref(false)
const editingRol = ref<Role | null>(null)
const page = ref(1)
const pageCount = ref(10)
/** id del rol en proceso de activar/desactivar */
const togglingId = ref<number | null>(null)

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
  editingRol.value = null
  formDrawerOpen.value = true
}

function openEdit(role: Role) {
  editingRol.value = role
  formDrawerOpen.value = true
}

async function handleDelete(id: number) {
  await remove(id)
}

async function handleToggle(id: number) {
  if (togglingId.value) return
  togglingId.value = id
  try {
    await toggleActivo(id)
  } finally {
    togglingId.value = null
  }
}

onMounted(async () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  await fetchPaginado()
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Roles"
      description="Gestiona los niveles de acceso del sistema"
      search-placeholder="Buscar rol por nombre..."
      create-label="Nuevo Rol"
      @create="openCreate"
    />

    <ConfiguracionRolesTable
      :data="items"
      :loading="loading"
      :total="total"
      :toggling-id="togglingId"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @edit="openEdit"
      @toggle="handleToggle"
      @delete="handleDelete"
    />

    <ConfiguracionRolesDrawer
      v-model:open="formDrawerOpen"
      :rol="editingRol"
      @refresh="fetchPaginado"
    />
  </div>
</template>
