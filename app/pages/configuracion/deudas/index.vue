<script setup lang="ts">
import type { Debt } from '~/services/debts.service'

const { items, total, loading, fetchPaginado, liquidar, remove, filter } = useDeudas()
const auth = useAuthStore()
const currency = computed(() => auth.user?.currency || 'MXN')

const search = ref('')
const status = ref<'open' | 'paid' | undefined>(undefined)
const formDrawerOpen = ref(false)
const editingDeuda = ref<Debt | null>(null)
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

watch(status, (v) => {
  page.value = 1
  filter.pagina = 1
  filter.status = v
  fetchPaginado()
})

function openCreate() {
  editingDeuda.value = null
  formDrawerOpen.value = true
}

function openEdit(deuda: Debt) {
  editingDeuda.value = deuda
  formDrawerOpen.value = true
}

async function handleSettle(deuda: Debt) {
  await liquidar(deuda.id)
}

async function handleDelete(id: string) {
  await remove(id)
}

const statusItems = [
  { value: undefined as unknown as string, label: 'Todas' },
  { value: 'open', label: 'Vigentes' },
  { value: 'paid', label: 'Liquidadas' },
]

onMounted(async () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  filter.status = undefined
  await fetchPaginado()
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Deudas"
      description="Gestiona pasivos por pagar y por cobrar"
      search-placeholder="Buscar deuda por nombre o contraparte..."
      create-label="Nueva Deuda"
      @create="openCreate"
    >
      <template #filters>
        <USelectMenu
          v-model="status"
          :items="statusItems"
          value-key="value"
          label-key="label"
          placeholder="Todas"
          class="w-40"
        />
      </template>
    </AppToolbar>

    <ConfiguracionDeudasTable
      :data="items"
      :loading="loading"
      :total="total"
      :currency="currency"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @edit="openEdit"
      @settle="handleSettle"
      @delete="handleDelete"
    />

    <ConfiguracionDeudasDrawer
      v-model:open="formDrawerOpen"
      :deuda="editingDeuda"
      @refresh="fetchPaginado"
    />
  </div>
</template>
