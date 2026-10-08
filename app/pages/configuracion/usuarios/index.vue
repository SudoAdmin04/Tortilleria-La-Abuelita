<script setup lang="ts">
import type { User } from '~/services/users.service'

const { items, total, loading, fetchPaginado, toggleActivo, filter } = useUsuarios()
const { items: roles, fetchAll } = useRoles()

const search = ref('')
const formDrawerOpen = ref(false)
const editingUsuario = ref<User | null>(null)
const page = ref(1)
const pageCount = ref(10)
/** id del usuario en proceso de activar/desactivar */
const togglingId = ref<string | null>(null)

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
  editingUsuario.value = null
  formDrawerOpen.value = true
}

function openEdit(user: User) {
  editingUsuario.value = user
  formDrawerOpen.value = true
}

async function handleToggle(id: string) {
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
  await Promise.all([fetchPaginado(), fetchAll()])
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Usuarios"
      description="Gestiona los accesos y roles del sistema"
      search-placeholder="Buscar usuario por nombre o correo..."
      create-label="Nuevo Usuario"
      @create="openCreate"
    />

    <ConfiguracionUsuariosTable
      :data="items"
      :loading="loading"
      :total="total"
      :toggling-id="togglingId"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @edit="openEdit"
      @toggle="handleToggle"
    />

    <ConfiguracionUsuariosDrawer
      v-model:open="formDrawerOpen"
      :usuario="editingUsuario"
      :roles="roles"
      @refresh="fetchPaginado"
    />
  </div>
</template>
