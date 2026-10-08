<script setup lang="ts">
import type { Screen } from '~/services/screens.service'

const { items, total, loading, fetchPaginado, toggleActivo, remove, filter } = usePantallas()

const search = ref('')
const formDrawerOpen = ref(false)
const editingPantalla = ref<Screen | null>(null)
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
  editingPantalla.value = null
  formDrawerOpen.value = true
}

function openEdit(screen: Screen) {
  editingPantalla.value = screen
  formDrawerOpen.value = true
}

async function handleToggle(id: number) {
  await toggleActivo(id)
}

async function handleDelete(id: number) {
  await remove(id)
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
      title="Pantallas"
      description="Catálogo de pantallas · viajan en el JWT como permisos"
      search-placeholder="Buscar pantalla por nombre o ruta..."
      create-label="Nueva Pantalla"
      @create="openCreate"
    />

    <ConfiguracionPantallasTable
      :data="items"
      :loading="loading"
      :total="total"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @edit="openEdit"
      @toggle="handleToggle"
      @delete="handleDelete"
    />

    <ConfiguracionPantallasDrawer
      v-model:open="formDrawerOpen"
      :pantalla="editingPantalla"
      :pantallas="items"
      @refresh="fetchPaginado"
    />
  </div>
</template>
