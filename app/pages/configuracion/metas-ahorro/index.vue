<script setup lang="ts">
import { listAccounts } from '~/services/accounts.service'
import { listCategories } from '~/services/categories.service'
import type { SavingsGoal } from '~/services/savings-goals.service'
import { monthYearLabel } from '~/utils/format'

const { items, metas, total, loading, fetchPaginado, remove, filter } = useMetasAhorro()
const auth = useAuthStore()
const currency = computed(() => auth.user?.currency || 'MXN')
const dash = useDashboardData()

const search = ref('')
const formDrawerOpen = ref(false)
const editingMeta = ref<SavingsGoal | null>(null)
const page = ref(1)
const pageCount = ref(10)
const cuentasOpts = ref<{ value: string; label: string }[]>([])
const catsOpts = ref<{ value: string; label: string }[]>([])

const periodLabel = computed(() => monthYearLabel(filter.year, filter.month))

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

watch(() => [dash.period.value.year, dash.period.value.month], ([y, m]) => {
  filter.year = y as number
  filter.month = m as number
  fetchPaginado()
})

function openCreate() {
  editingMeta.value = null
  formDrawerOpen.value = true
}

function openEdit(id: string) {
  editingMeta.value = metas.value.find(m => m.id === id) || null
  formDrawerOpen.value = true
}

async function handleDelete(id: string) {
  await remove(id)
}

async function loadCatalogos() {
  try {
    const [acc, cats] = await Promise.all([listAccounts(), listCategories(false)])
    cuentasOpts.value = (acc as any[]).map(a => ({ value: a.id, label: a.name }))
    catsOpts.value = (cats as any[]).map(c => ({ value: c.id, label: c.name }))
  } catch {
    cuentasOpts.value = []
    catsOpts.value = []
  }
}

onMounted(async () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  filter.year = dash.period.value.year
  filter.month = dash.period.value.month
  await Promise.all([fetchPaginado(), loadCatalogos()])
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Metas de Ahorro"
      :description="`${periodLabel} · avance del mes`"
      search-placeholder="Buscar meta..."
      create-label="Nueva Meta"
      @create="openCreate"
    />

    <ConfiguracionMetasAhorroTable
      :data="items"
      :loading="loading"
      :total="total"
      :currency="currency"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @edit="openEdit"
      @delete="handleDelete"
    />

    <ConfiguracionMetasAhorroDrawer
      v-model:open="formDrawerOpen"
      :meta="editingMeta"
      :cuentas="cuentasOpts"
      :categorias="catsOpts"
      @refresh="fetchPaginado"
    />
  </div>
</template>
