<script setup lang="ts">
import type { Purchase } from '~/services/purchases.service'
import type { Supplier } from '~/services/suppliers.service'
import { formatMoney } from '~/utils/format'

useHead({ title: 'Compras' })

const { items, total, loading, error, fetchPaginado, cancel, filter } = useCompras()
const { fetchAll: fetchProveedores } = useProveedores()
const auth = useAuthStore()
const permisos = usePermisosStore()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/compras', 'canCreate'))
const puedeCancelar = computed(() => permisos.can('/compras', 'canUpdate'))

const proveedores = ref<Supplier[]>([])
const proveedoresOpts = computed(() => proveedores.value.map(p => ({ value: p.id, label: p.name })))

const formDrawerOpen = ref(false)
const detailDrawerOpen = ref(false)
const compraSeleccionada = ref<Purchase | null>(null)
const page = ref(1)
const pageCount = ref(10)

const stats = computed(() => {
  const recibidas = items.value.filter(c => c.status === 'received')
  const canceladas = items.value.filter(c => c.status === 'cancelled')
  const monto = recibidas.reduce((sum, c) => sum + c.total, 0)
  return [
    {
      label: 'Compras registradas',
      value: String(total.value),
      sub: 'Total del periodo filtrado',
      icon: 'i-lucide-shopping-cart',
      tone: 'primary' as const,
    },
    {
      label: 'Monto recibido',
      value: formatMoney(monto, currency.value),
      sub: 'En la página actual',
      icon: 'i-lucide-wallet',
      tone: 'success' as const,
    },
    {
      label: 'Recibidas',
      value: String(recibidas.length),
      sub: 'En la página actual',
      icon: 'i-lucide-circle-check',
      tone: 'neutral' as const,
    },
    {
      label: 'Canceladas',
      value: String(canceladas.length),
      sub: 'En la página actual',
      icon: 'i-lucide-ban',
      tone: canceladas.length ? 'warning' as const : 'neutral' as const,
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
  filter.supplierId = undefined
  filter.status = undefined
  filter.from = undefined
  filter.to = undefined
  aplicarFiltros()
}

function openCreate() {
  formDrawerOpen.value = true
}

function openDetail(compra: Purchase) {
  compraSeleccionada.value = compra
  detailDrawerOpen.value = true
}

async function handleCancel(id: string) {
  await cancel(id)
}

onMounted(async () => {
  filter.page = page.value
  filter.limit = pageCount.value
  filter.supplierId = undefined
  filter.status = undefined
  filter.from = undefined
  filter.to = undefined
  fetchPaginado()
  proveedores.value = await fetchProveedores()
})
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Compras"
      :description="`Compras de insumos a proveedores · ${total} registros`"
      hide-search
      :create-label="puedeCrear ? 'Registrar Compra' : undefined"
      create-icon="i-lucide-shopping-cart"
      @create="openCreate"
    />

    <UAlert
      v-if="error && !items.length"
      color="error"
      variant="subtle"
      title="No se pudieron cargar las compras"
      :description="error"
    />

    <AppStatCards :stats="stats" :loading="loading" />

    <ComprasFilters
      v-model:supplier-id="filter.supplierId"
      v-model:status="filter.status"
      v-model:from="filter.from"
      v-model:to="filter.to"
      :proveedores="proveedoresOpts"
      @filtrar="aplicarFiltros"
      @limpiar="limpiarFiltros"
    />

    <ComprasTable
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

    <ComprasDrawer
      v-model:open="formDrawerOpen"
      :currency="currency"
      @refresh="fetchPaginado"
    />

    <ComprasDetailDrawer
      v-model:open="detailDrawerOpen"
      :compra="compraSeleccionada"
      :currency="currency"
    />
  </div>
</template>
