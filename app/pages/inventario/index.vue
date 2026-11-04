<script setup lang="ts">
import type { LowStockItem } from '~/services/inventory.service'
import type { Supply } from '~/services/supplies.service'
import type { Product } from '~/services/products.service'
import { formatMoney } from '~/utils/format'

useHead({ title: 'Inventario' })

const {
  summary,
  movements,
  loadingSummary,
  loadingMovements,
  error,
  total,
  filter,
  fetchSummary,
  fetchMovements,
  refreshAll,
} = useInventario()
const { fetchAll: fetchInsumos } = useInsumos()
const { fetchAll: fetchProductos } = useProductos()
const auth = useAuthStore()
const permisos = usePermisosStore()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeAjustar = computed(() => permisos.can('/inventario', 'canCreate') || permisos.can('/inventario', 'canUpdate'))

const insumos = ref<Supply[]>([])
const productos = ref<Product[]>([])

const adjustDrawerOpen = ref(false)
const ajusteInicial = ref<LowStockItem | null>(null)
const page = ref(1)
const pageCount = ref(10)

const stats = computed(() => {
  const s = summary.value
  return [
    {
      label: 'Valor del inventario',
      value: formatMoney(s?.totalValue ?? 0, currency.value),
      sub: `Insumos ${formatMoney(s?.suppliesValue ?? 0, currency.value)} · Productos ${formatMoney(s?.productsValue ?? 0, currency.value)}`,
      icon: 'i-lucide-boxes',
      tone: 'primary' as const,
    },
    {
      label: 'Insumos en catálogo',
      value: String(s?.suppliesCount ?? 0),
      sub: 'Materias primas activas',
      icon: 'i-lucide-wheat',
      tone: 'neutral' as const,
    },
    {
      label: 'Productos en catálogo',
      value: String(s?.productsCount ?? 0),
      sub: 'Productos terminados',
      icon: 'i-lucide-cookie',
      tone: 'success' as const,
    },
    {
      label: 'Alertas de stock',
      value: String(s?.lowStockCount ?? 0),
      sub: `${s?.outOfStockCount ?? 0} agotado(s)`,
      icon: 'i-lucide-triangle-alert',
      tone: (s?.lowStockCount ?? 0) > 0 ? 'warning' as const : 'neutral' as const,
    },
  ]
})

const lowStock = computed<LowStockItem[]>(() => summary.value?.lowStock ?? [])

watch([page, pageCount], () => {
  filter.page = page.value
  filter.limit = pageCount.value
  fetchMovements()
})

function aplicarFiltros() {
  page.value = 1
  filter.page = 1
  fetchMovements()
}

function limpiarFiltros() {
  filter.itemType = undefined
  filter.type = undefined
  filter.from = undefined
  filter.to = undefined
  aplicarFiltros()
}

function openAdjust(item?: LowStockItem) {
  ajusteInicial.value = item ?? null
  adjustDrawerOpen.value = true
}

async function refrescar() {
  page.value = 1
  filter.page = 1
  await refreshAll()
}

onMounted(async () => {
  filter.page = page.value
  filter.limit = pageCount.value
  filter.itemType = undefined
  filter.type = undefined
  filter.from = undefined
  filter.to = undefined
  fetchSummary()
  fetchMovements()
  const [insumosData, productosData] = await Promise.all([fetchInsumos(), fetchProductos()])
  insumos.value = insumosData
  productos.value = productosData
})
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Inventario"
      :description="`Kardex, alertas de stock y ajustes · ${total} movimientos`"
      hide-search
      :create-label="puedeAjustar ? 'Ajuste de Inventario' : undefined"
      create-icon="i-lucide-sliders-horizontal"
      @create="openAdjust()"
    />

    <UAlert
      v-if="error && !movements.length"
      color="error"
      variant="subtle"
      title="No se pudo cargar el inventario"
      :description="error"
    />

    <AppStatCards :stats="stats" :loading="loadingSummary" />

    <InventarioLowStockTable
      :items="lowStock"
      :loading="loadingSummary"
      @adjust="openAdjust"
    />

    <InventarioFilters
      v-model:item-type="filter.itemType"
      v-model:type="filter.type"
      v-model:from="filter.from"
      v-model:to="filter.to"
      @filtrar="aplicarFiltros"
      @limpiar="limpiarFiltros"
    />

    <InventarioMovementsTable
      v-model:page="page"
      v-model:page-count="pageCount"
      :data="movements"
      :loading="loadingMovements"
      :total="total"
      :currency="currency"
      :supplies="insumos"
      :products="productos"
    />

    <InventarioAdjustDrawer
      v-model:open="adjustDrawerOpen"
      :initial="ajusteInicial"
      :currency="currency"
      @refresh="refrescar"
    />
  </div>
</template>
