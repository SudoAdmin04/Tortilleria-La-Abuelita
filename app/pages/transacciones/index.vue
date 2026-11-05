<script setup lang="ts">
import { listAccounts } from '~/services/accounts.service'
import { listCategories } from '~/services/categories.service'
import type { Transaction } from '~/services/transactions.service'
import type { ExportFormat } from '~/services/exports.repository'

useHead({ title: 'Transacciones' })

const { items, total, loading, fetchPaginado, fetchResumen, fetchAnaliticas, summary, summaryLoading, gastos, gastosLoading, ingresos, ingresosLoading, remove, conciliar, filter } = useTransacciones()
const auth = useAuthStore()
const permisos = usePermisosStore()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/transacciones', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/transacciones', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/transacciones', 'canDelete'))

const search = ref('')
const formDrawerOpen = ref(false)
const editingTx = ref<Transaction | null>(null)
const page = ref(1)
const pageCount = ref(20)
const cuentasOpts = ref<{ value: string; label: string }[]>([])
const categoriasOpts = ref<{ value: string; label: string }[]>([])

const conteos = computed(() => ({
  total: summary.value?.totalCount ?? total.value,
  income: summary.value?.income.count ?? items.value.filter(t => t.type === 'income').length,
  expense: summary.value?.expense.count ?? items.value.filter(t => t.type === 'expense').length,
  transfer: summary.value?.transfers.count ?? items.value.filter(t => t.type === 'transfer').length,
}))

const totalRegistros = computed(() => summary.value?.totalCount ?? total.value)

const { downloadTransactions, isExporting } = useExports()

const exportando = computed(() =>
  isExporting('transactions', 'pdf') || isExporting('transactions', 'xlsx'),
)

function exportar(format: ExportFormat) {
  return downloadTransactions(format, {
    from: filter.desde,
    to: filter.hasta,
    type: filter.tipo,
    status: filter.estado,
    paymentMethod: filter.metodoPago,
    categoryId: filter.categoriaId,
    accountId: filter.cuentaId,
    search: filter.buscar?.trim() || undefined,
    order: 'desc',
  })
}

const exportMenu = [
  [
    { label: 'PDF', icon: 'i-lucide-file-text', onSelect: () => exportar('pdf') },
    { label: 'Excel (XLSX)', icon: 'i-lucide-file-spreadsheet', onSelect: () => exportar('xlsx') },
  ],
]

function refreshAll() {
  return Promise.all([fetchPaginado(), fetchResumen(), fetchAnaliticas()])
}

let searchTimer: ReturnType<typeof setTimeout> | undefined

watch([page, pageCount], () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  refreshAll()
})

watch(search, (v) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    filter.pagina = 1
    filter.buscar = v?.trim() ? v.trim() : undefined
    refreshAll()
  }, 350)
})

function aplicarFiltros() {
  page.value = 1
  filter.pagina = 1
  refreshAll()
}

function limpiarFiltros() {
  search.value = ''
  filter.buscar = undefined
  filter.tipo = undefined
  filter.estado = undefined
  filter.cuentaId = undefined
  filter.categoriaId = undefined
  filter.desde = undefined
  filter.hasta = undefined
  filter.metodoPago = undefined
  aplicarFiltros()
}

function openCreate() {
  editingTx.value = null
  formDrawerOpen.value = true
}

function openEdit(tx: Transaction) {
  editingTx.value = tx
  formDrawerOpen.value = true
}

async function handleDelete(id: string) {
  await remove(id)
}

async function handleReconcile(id: string) {
  await conciliar(id)
}

function toArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  return (res as { items?: T[]; data?: T[] } | null)?.items
    ?? (res as { data?: T[] } | null)?.data
    ?? []
}

async function loadCatalogos() {
  try {
    const [acc, cats] = await Promise.all([listAccounts(), listCategories(false)])
    cuentasOpts.value = toArray<any>(acc).map(a => ({ value: a.id, label: a.name }))
    categoriasOpts.value = toArray<any>(cats).map(c => ({ value: c.id, label: c.parentId ? `${c.name}` : c.name }))
  } catch {
    cuentasOpts.value = []
    categoriasOpts.value = []
  }
}

onMounted(async () => {
  filter.pagina = page.value
  filter.registros = pageCount.value
  filter.buscar = undefined
  await Promise.all([refreshAll(), loadCatalogos()])
})

onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Transacciones"
      :description="`Ingresos, egresos y traspasos · ${totalRegistros} registros`"
      search-placeholder="Buscar concepto..."
      :create-label="puedeCrear ? 'Registrar Movimiento' : undefined"
      @create="openCreate"
    >
      <template #actions>
        <UDropdownMenu :items="exportMenu" :content="{ align: 'end' }">
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="outline"
            :loading="exportando"
            trailing-icon="i-lucide-chevron-down"
          >
            <span class="hidden sm:inline">Exportar</span>
          </UButton>
        </UDropdownMenu>
      </template>
    </AppToolbar>

    <TransaccionesStatsCards
      :summary="summary"
      :currency="currency"
      :loading="summaryLoading && !summary"
    />

    <TransaccionesFilters
      v-model:tipo="filter.tipo"
      v-model:estado="filter.estado"
      v-model:cuenta-id="filter.cuentaId"
      v-model:categoria-id="filter.categoriaId"
      v-model:search="search"
      :cuentas="cuentasOpts"
      :categorias="categoriasOpts"
      :conteos="conteos"
      @filtrar="aplicarFiltros"
      @limpiar="limpiarFiltros"
    />

    <TransaccionesTable
      :data="items"
      :loading="loading"
      :total="total"
      :currency="currency"
      :puede-editar="puedeEditar"
      :puede-eliminar="puedeEliminar"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @edit="openEdit"
      @delete="handleDelete"
      @reconcile="handleReconcile"
    />

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <TransaccionesExpensesDistribution
        :data="gastos"
        :currency="currency"
        :loading="gastosLoading && !gastos"
      />
      <TransaccionesIncomeSources
        :data="ingresos"
        :currency="currency"
        :loading="ingresosLoading && !ingresos"
      />
    </div>

    <TransaccionesDrawer
      v-model:open="formDrawerOpen"
      :mov="editingTx"
      :cuentas="cuentasOpts"
      :categorias="categoriasOpts"
      @refresh="refreshAll"
    />
  </div>
</template>
