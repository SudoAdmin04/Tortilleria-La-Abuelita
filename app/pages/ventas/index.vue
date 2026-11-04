<script setup lang="ts">
import type { Sale } from '~/services/sales.service'
import { formatMoney } from '~/utils/format'

useHead({ title: 'Ventas' })

const { items, total, loading, error, fetchPaginado, cancel, filter } = useVentas()
const auth = useAuthStore()
const permisos = usePermisosStore()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/ventas', 'canCreate'))
const puedeCancelar = computed(() => permisos.can('/ventas', 'canUpdate'))

const formDrawerOpen = ref(false)
const detailDrawerOpen = ref(false)
const ventaSeleccionada = ref<Sale | null>(null)
const page = ref(1)
const pageCount = ref(10)

const stats = computed(() => {
  const completadas = items.value.filter(v => v.status === 'completed')
  const monto = completadas.reduce((sum, v) => sum + v.total, 0)
  const utilidad = completadas.reduce((sum, v) => sum + v.grossProfit, 0)
  const ticket = completadas.length ? monto / completadas.length : 0
  return [
    {
      label: 'Ventas registradas',
      value: String(total.value),
      sub: 'Total del periodo filtrado',
      icon: 'i-lucide-badge-dollar-sign',
      tone: 'primary' as const,
    },
    {
      label: 'Monto vendido',
      value: formatMoney(monto, currency.value),
      sub: 'En la página actual',
      icon: 'i-lucide-wallet',
      tone: 'success' as const,
    },
    {
      label: 'Utilidad bruta',
      value: formatMoney(utilidad, currency.value),
      sub: 'En la página actual',
      icon: 'i-lucide-trending-up',
      tone: utilidad >= 0 ? 'success' as const : 'danger' as const,
    },
    {
      label: 'Ticket promedio',
      value: formatMoney(ticket, currency.value),
      sub: 'En la página actual',
      icon: 'i-lucide-receipt',
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
  filter.status = undefined
  filter.from = undefined
  filter.to = undefined
  aplicarFiltros()
}

function openCreate() {
  formDrawerOpen.value = true
}

function openDetail(venta: Sale) {
  ventaSeleccionada.value = venta
  detailDrawerOpen.value = true
}

async function handleCancel(id: string) {
  await cancel(id)
}

onMounted(() => {
  filter.page = page.value
  filter.limit = pageCount.value
  filter.status = undefined
  filter.from = undefined
  filter.to = undefined
  fetchPaginado()
})
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Ventas"
      :description="`Ventas de productos al mostrador · ${total} registros`"
      hide-search
      :create-label="puedeCrear ? 'Registrar Venta' : undefined"
      create-icon="i-lucide-badge-dollar-sign"
      @create="openCreate"
    />

    <UAlert
      v-if="error && !items.length"
      color="error"
      variant="subtle"
      title="No se pudieron cargar las ventas"
      :description="error"
    />

    <AppStatCards :stats="stats" :loading="loading" />

    <VentasFilters
      v-model:status="filter.status"
      v-model:from="filter.from"
      v-model:to="filter.to"
      @filtrar="aplicarFiltros"
      @limpiar="limpiarFiltros"
    />

    <VentasTable
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

    <VentasDrawer
      v-model:open="formDrawerOpen"
      :currency="currency"
      @refresh="fetchPaginado"
    />

    <VentasDetailDrawer
      v-model:open="detailDrawerOpen"
      :venta="ventaSeleccionada"
      :currency="currency"
    />
  </div>
</template>
