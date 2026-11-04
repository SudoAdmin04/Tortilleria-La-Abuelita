<script setup lang="ts">
import type { Production } from '~/services/production.service'
import type { Product } from '~/services/products.service'
import { formatMoney } from '~/utils/format'

useHead({ title: 'Producción' })

const { items, total, loading, error, fetchPaginado, cancel, filter } = useProduccion()
const { fetchAll: fetchProductos } = useProductos()
const auth = useAuthStore()
const permisos = usePermisosStore()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/produccion', 'canCreate'))
const puedeCancelar = computed(() => permisos.can('/produccion', 'canUpdate'))

const productos = ref<Product[]>([])
const productosOpts = computed(() => productos.value.map(p => ({ value: p.id, label: p.name })))

const formDrawerOpen = ref(false)
const detailDrawerOpen = ref(false)
const loteSeleccionado = ref<Production | null>(null)
const page = ref(1)
const pageCount = ref(10)

const stats = computed(() => {
  const completados = items.value.filter(p => p.status === 'completed')
  const unidades = completados.reduce((sum, p) => sum + p.quantity, 0)
  const costo = completados.reduce((sum, p) => sum + p.totalCost, 0)
  return [
    {
      label: 'Lotes registrados',
      value: String(total.value),
      sub: 'Total del periodo filtrado',
      icon: 'i-lucide-factory',
      tone: 'primary' as const,
    },
    {
      label: 'Unidades producidas',
      value: String(Number(unidades.toFixed(2))),
      sub: 'En la página actual',
      icon: 'i-lucide-package',
      tone: 'success' as const,
    },
    {
      label: 'Costo de producción',
      value: formatMoney(costo, currency.value),
      sub: 'En la página actual',
      icon: 'i-lucide-coins',
      tone: 'warning' as const,
    },
    {
      label: 'Lotes completados',
      value: String(completados.length),
      sub: 'En la página actual',
      icon: 'i-lucide-circle-check',
      tone: 'neutral' as const,
    },
  ]
})

watch([page, pageCount], () => {
  filter.page = page.value
  filter.limit = pageCount.value
  fetchPaginado()
})

function aplicarFiltros() {
  page.value = 1
  filter.page = 1
  fetchPaginado()
}

function limpiarFiltros() {
  filter.productId = undefined
  filter.status = undefined
  filter.from = undefined
  filter.to = undefined
  aplicarFiltros()
}

function openCreate() {
  formDrawerOpen.value = true
}

function openDetail(lote: Production) {
  loteSeleccionado.value = lote
  detailDrawerOpen.value = true
}

async function handleCancel(id: string) {
  await cancel(id)
}

onMounted(async () => {
  filter.page = page.value
  filter.limit = pageCount.value
  filter.productId = undefined
  filter.status = undefined
  filter.from = undefined
  filter.to = undefined
  fetchPaginado()
  productos.value = await fetchProductos()
})
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Producción"
      :description="`Lotes producidos y consumo de insumos · ${total} registros`"
      hide-search
      :create-label="puedeCrear ? 'Registrar Producción' : undefined"
      create-icon="i-lucide-factory"
      @create="openCreate"
    />

    <UAlert
      v-if="error && !items.length"
      color="error"
      variant="subtle"
      title="No se pudieron cargar los lotes"
      :description="error"
    />

    <AppStatCards :stats="stats" :loading="loading" />

    <ProduccionFilters
      v-model:product-id="filter.productId"
      v-model:status="filter.status"
      v-model:from="filter.from"
      v-model:to="filter.to"
      :productos="productosOpts"
      @filtrar="aplicarFiltros"
      @limpiar="limpiarFiltros"
    />

    <ProduccionTable
      :data="items"
      :loading="loading"
      :total="total"
      :currency="currency"
      :puede-editar="puedeCancelar"
      v-model:page="page"
      v-model:page-count="pageCount"
      @detail="openDetail"
      @cancel="handleCancel"
    />

    <ProduccionDrawer
      v-model:open="formDrawerOpen"
      :currency="currency"
      @refresh="fetchPaginado"
    />

    <ProduccionDetailDrawer
      v-model:open="detailDrawerOpen"
      :lote="loteSeleccionado"
      :currency="currency"
    />
  </div>
</template>
