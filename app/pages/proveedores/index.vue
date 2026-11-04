<script setup lang="ts">
import type { Supplier } from '~/services/suppliers.service'

useHead({ title: 'Proveedores' })

const { items, total, loading, error, fetchPaginado, toggleActivo, remove, filter } = useProveedores()
const permisos = usePermisosStore()
const puedeCrear = computed(() => permisos.can('/proveedores', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/proveedores', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/proveedores', 'canDelete'))

const search = ref('')
const formDrawerOpen = ref(false)
const editingProveedor = ref<Supplier | null>(null)
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
  aplicarFiltros()
}

function openCreate() {
  editingProveedor.value = null
  formDrawerOpen.value = true
}

function openEdit(proveedor: Supplier) {
  editingProveedor.value = proveedor
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

onMounted(() => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  filter.isActive = undefined
  fetchPaginado()
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Proveedores"
      :description="`Directorio de proveedores de insumos · ${total} registros`"
      search-placeholder="Buscar proveedor por nombre..."
      :create-label="puedeCrear ? 'Nuevo Proveedor' : undefined"
      @create="openCreate"
    />

    <UAlert
      v-if="error && !items.length"
      color="error"
      variant="subtle"
      title="No se pudieron cargar los proveedores"
      :description="error"
    />

    <ProveedoresFilters
      v-model:is-active="filter.isActive"
      @filtrar="aplicarFiltros"
      @limpiar="limpiarFiltros"
    />

    <ProveedoresTable
      :data="items"
      :loading="loading"
      :total="total"
      :toggling-id="togglingId"
      :puede-editar="puedeEditar"
      :puede-eliminar="puedeEliminar"
      v-model:page="page"
      v-model:page-count="pageCount"
      @edit="openEdit"
      @toggle="handleToggle"
      @delete="handleDelete"
    />

    <ProveedoresDrawer
      v-model:open="formDrawerOpen"
      :proveedor="editingProveedor"
      @refresh="fetchPaginado"
    />
  </div>
</template>
