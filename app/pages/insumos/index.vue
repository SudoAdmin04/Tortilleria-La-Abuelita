<script setup lang="ts">
import type { Supply } from '~/services/supplies.service'

useHead({ title: 'Insumos' })

const { items, total, loading, error, fetchPaginado, toggleActivo, remove, filter } = useInsumos()
const auth = useAuthStore()
const permisos = usePermisosStore()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/insumos', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/insumos', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/insumos', 'canDelete'))

const search = ref('')
const formDrawerOpen = ref(false)
const editingInsumo = ref<Supply | null>(null)
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
  editingInsumo.value = null
  formDrawerOpen.value = true
}

function openEdit(insumo: Supply) {
  editingInsumo.value = insumo
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
  filter.lowStock = undefined
  fetchPaginado()
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Insumos"
      :description="`Materias primas con stock y costo promedio · ${total} registros`"
      search-placeholder="Buscar insumo por nombre..."
      :create-label="puedeCrear ? 'Nuevo Insumo' : undefined"
      @create="openCreate"
    />

    <UAlert
      v-if="error && !items.length"
      color="error"
      variant="subtle"
      title="No se pudieron cargar los insumos"
      :description="error"
    />

    <InsumosFilters
      v-model:is-active="filter.isActive"
      v-model:low-stock="filter.lowStock"
      @filtrar="aplicarFiltros"
      @limpiar="limpiarFiltros"
    />

    <InsumosTable
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
      @toggle="handleToggle"
      @delete="handleDelete"
    />

    <InsumosDrawer
      v-model:open="formDrawerOpen"
      :insumo="editingInsumo"
      @refresh="fetchPaginado"
    />
  </div>
</template>
