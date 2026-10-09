<script setup lang="ts">
import type { Account } from '~/services/accounts.service'
import { formatMoney } from '~/utils/format'

useHead({ title: 'Cuentas' })

const { items, total, loading, resumen, fetchPaginado, remove, toggleActive, setPrimary, filter } = useCuentas()
const auth = useAuthStore()
const permisos = usePermisosStore()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/cuentas', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/cuentas', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/cuentas', 'canDelete'))

const search = ref('')
const formDrawerOpen = ref(false)
const editingCuenta = ref<Account | null>(null)
const page = ref(1)
const pageCount = ref(9)

let searchTimer: ReturnType<typeof setTimeout> | undefined

const stats = computed(() => [
  {
    label: 'Saldo total (activas)',
    value: formatMoney(resumen.value.saldoTotal, currency.value),
    sub: `${resumen.value.activas} ${resumen.value.activas === 1 ? 'cuenta activa' : 'cuentas activas'}`,
    icon: 'i-lucide-wallet',
    tone: 'success' as const,
  },
  {
    label: 'Cuentas',
    value: `${resumen.value.activas} / ${resumen.value.totalCuentas}`,
    sub: `${resumen.value.inactivas} inactivas`,
    icon: 'i-lucide-layers',
    tone: 'primary' as const,
  },
  {
    label: 'Cuenta principal',
    value: resumen.value.principal?.name ?? '—',
    sub: resumen.value.principal
      ? formatMoney(resumen.value.principal.balance, resumen.value.principal.currency || currency.value)
      : 'Sin principal seleccionada',
    icon: 'i-lucide-star',
    tone: 'warning' as const,
  },
])

const tipoItems = [
  { value: undefined, label: 'Todos los tipos' },
  { value: 'checking', label: 'Cheques' },
  { value: 'savings', label: 'Ahorro' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'credit_card', label: 'Tarjeta' },
]

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
  editingCuenta.value = null
  formDrawerOpen.value = true
}

function openEdit(cuenta: Account) {
  editingCuenta.value = cuenta
  formDrawerOpen.value = true
}

async function handleDelete(cuenta: Account) {
  await remove(cuenta.id)
}

async function handleToggleActive(cuenta: Account) {
  await toggleActive(cuenta)
}

async function handleSetPrimary(cuenta: Account) {
  await setPrimary(cuenta)
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
      title="Cuentas"
      description="Bancos, efectivo y tarjetas · balance calculado"
      search-placeholder="Buscar cuenta o institución..."
      :create-label="puedeCrear ? 'Nueva Cuenta' : undefined"
      @create="openCreate"
    />

    <AppStatCards :stats="stats" :loading="loading" :columns="3" />

    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <USelectMenu
        v-model="filter.tipo"
        :items="tipoItems"
        value-key="value"
        label-key="label"
        placeholder="Todos los tipos"
        class="w-full sm:w-56"
        @update:model-value="() => { page = 1; filter.pagina = 1; fetchPaginado() }"
      />
      <div class="flex items-center gap-2">
        <USwitch v-model="filter.soloActivas" @update:model-value="() => { page = 1; filter.pagina = 1; fetchPaginado() }" />
        <span class="text-xs text-white/60 font-medium">Solo activas</span>
      </div>
    </div>

    <CuentasCards
      :data="items"
      :loading="loading"
      :currency="currency"
      :puede-editar="puedeEditar"
      :puede-eliminar="puedeEliminar"
      @edit="openEdit"
      @delete="handleDelete"
      @toggle-active="handleToggleActive"
      @set-primary="handleSetPrimary"
    />

    <div v-if="total > pageCount || page > 1" class="flex items-center justify-end gap-4 text-xs">
      <span class="text-white/60 font-medium">
        Mostrando {{ (page - 1) * pageCount + 1 }}-{{ Math.min(page * pageCount, total) }} de {{ total }} cuentas
      </span>
      <UPagination
        v-model:page="page"
        :items-per-page="pageCount"
        :total="total"
        size="xs"
      />
    </div>

    <CuentasDrawer
      v-model:open="formDrawerOpen"
      :cuenta="editingCuenta"
      @refresh="fetchPaginado"
    />
  </div>
</template>
