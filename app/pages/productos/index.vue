<script setup lang="ts">
import type { Product } from '~/services/products.service'

useHead({ title: 'Productos' })

const { items, total, loading, error, fetchPaginado, toggleActivo, remove, filter } = useProductos()
const auth = useAuthStore()
const permisos = usePermisosStore()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/productos', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/productos', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/productos', 'canDelete'))

const search = ref('')
const formDrawerOpen = ref(false)
const recipeDrawerOpen = ref(false)
const editingProducto = ref<Product | null>(null)
const recipeProducto = ref<Product | null>(null)
const page = ref(1)
const pageCount = ref(10)
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

function aplicarFiltros() {
  page.value = 1
  filter.pagina = 1
  fetchPaginado()
}

function limpiarFiltros() {
  filter.isActive = undefined
  filter.lowStock = undefined
  aplicarFiltros()
}

function openCreate() {
  editingProducto.value = null
  formDrawerOpen.value = true
}

function openEdit(producto: Product) {
  editingProducto.value = producto
  formDrawerOpen.value = true
}

function openRecipe(producto: Product) {
  recipeProducto.value = producto
  recipeDrawerOpen.value = true
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

onMounted(() => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  filter.isActive = undefined
  filter.lowStock = undefined
  fetchPaginado()
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Productos"
      :description="`Catálogo con receta, costo y margen · ${total} registros`"
      search-placeholder="Buscar producto por nombre..."
      :create-label="puedeCrear ? 'Nuevo Producto' : undefined"
      @create="openCreate"
    />

    <UAlert
      v-if="error && !items.length"
      color="error"
      variant="subtle"
      title="No se pudieron cargar los productos"
      :description="error"
    />

    <ProductosFilters
      v-model:is-active="filter.isActive"
      v-model:low-stock="filter.lowStock"
      @filtrar="aplicarFiltros"
      @limpiar="limpiarFiltros"
    />

    <ProductosTable
      :data="items"
      :loading="loading"
      :total="total"
      :currency="currency"
      :toggling-id="togglingId"
      :puede-editar="puedeEditar"
      :puede-eliminar="puedeEliminar"
      v-model:page="page"
      v-model:page-count="pageCount"
      @edit="openEdit"
      @recipe="openRecipe"
      @toggle="handleToggle"
      @delete="handleDelete"
    />

    <ProductosDrawer
      v-model:open="formDrawerOpen"
      :producto="editingProducto"
      @refresh="fetchPaginado"
    />

    <ProductosRecipeDrawer
      v-model:open="recipeDrawerOpen"
      :producto="recipeProducto"
      :currency="currency"
      @refresh="fetchPaginado"
    />
  </div>
</template>
