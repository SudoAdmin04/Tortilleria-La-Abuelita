<script setup lang="ts">
import type { CategoriaRow } from '~/composables/useCategorias'

const { items, rubros, total, loading, fetchPaginado, fetchTree, toggleActivo, remove, filter } = useCategorias()

const search = ref('')
const formDrawerOpen = ref(false)
const editingCategoria = ref<CategoriaRow | null>(null)
const page = ref(1)
const pageCount = ref(10)
/** id de la categoría en proceso de activar/desactivar */
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
  editingCategoria.value = null
  formDrawerOpen.value = true
}

function openEdit(categoria: CategoriaRow) {
  editingCategoria.value = categoria
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

async function handleDelete(id: string) {
  await remove(id)
}

onMounted(async () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  await Promise.all([fetchPaginado(), fetchTree()])
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Categorías"
      description="Gestiona rubros y partidas · máximo 2 niveles"
      search-placeholder="Buscar categoría..."
      create-label="Nueva Categoría"
      @create="openCreate"
    />

    <ConfiguracionCategoriasTable
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

    <ConfiguracionCategoriasDrawer
      v-model:open="formDrawerOpen"
      :categoria="editingCategoria"
      :rubros="rubros"
      @refresh="fetchPaginado"
    />
  </div>
</template>
