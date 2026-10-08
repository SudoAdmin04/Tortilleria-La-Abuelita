<script setup lang="ts">
const { items: notificaciones, total, loading, sinLeer, filter, fetchPaginado, toggleLeida, eliminar } = useNotificaciones()

const search = ref('')
const formDrawerOpen = ref(false)
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
  formDrawerOpen.value = true
}

async function handleToggle(id: string, isRead: boolean) {
  await toggleLeida(id, isRead)
}

async function handleDelete(id: string) {
  await eliminar(id)
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
      title="Notificaciones"
      :description="`${total} registros · ${sinLeer} sin leer`"
      search-placeholder="Buscar notificación..."
      create-label="Nueva Notificación"
      @create="openCreate"
    />

    <ConfiguracionNotificacionesTable
      :data="notificaciones"
      :loading="loading"
      :total="total"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @toggle="handleToggle"
      @delete="handleDelete"
    />

    <ConfiguracionNotificacionesDrawer
      v-model:open="formDrawerOpen"
      @refresh="fetchPaginado"
    />
  </div>
</template>
