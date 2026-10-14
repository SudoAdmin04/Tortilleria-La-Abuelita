<script setup lang="ts">
import type { Budget } from '~/services/budgets.service'
import type { PresupuestoRow } from '~/composables/usePresupuestos'
import { listCategories } from '~/services/categories.service'
import { formatMoney, formatExecution, monthYearLabel } from '~/utils/format'
import { getApiMessage } from '~/utils/api-error'

useHead({ title: 'Presupuestos' })

const auth = useAuthStore()
const permisos = usePermisosStore()
const toast = useToast()
const dash = useDashboardData()
const currency = computed(() => auth.user?.currency || 'MXN')

const p = usePresupuestos()
const search = ref('')
const drawerOpen = ref(false)
const editing = ref<Budget | null>(null)
const catOpts = ref<{ value: string, label: string }[]>([])

const periodLabel = computed(() => monthYearLabel(p.filter.year, p.filter.month))

const stats = computed(() => {
  const r = p.resumen.value
  return [
    { label: 'Planeado', value: formatMoney(r.planificado, currency.value), sub: `${r.total} rubros`, icon: 'i-lucide-wallet', tone: 'primary' as const },
    { label: 'Ejecutado', value: formatMoney(r.ejecutado, currency.value), sub: `Ejecución ${formatExecution(r.tasaEjecucion)}`, icon: 'i-lucide-receipt', tone: 'neutral' as const, progress: r.tasaEjecucion != null ? Math.min(100, Math.max(0, r.tasaEjecucion)) : null },
    { label: 'Restante', value: formatMoney(r.restante, currency.value), sub: r.esDeficit ? 'Déficit proyectado' : 'Superávit proyectado', icon: 'i-lucide-piggy-bank', tone: (r.restante < 0 ? 'danger' : 'success') as const },
    { label: 'Excedidos', value: `${r.excedidos}`, sub: `${r.enOrden} en orden · ${r.cercaLimite} cerca del límite`, icon: 'i-lucide-triangle-alert', tone: 'warning' as const },
  ]
})

let searchTimer: ReturnType<typeof setTimeout> | undefined

async function recargar() {
  await p.fetchAll()
  try {
    const cats = await listCategories(false)
    catOpts.value = (cats as any[]).filter(c => !c.parentId).map(c => ({ value: c.id, label: c.name }))
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudieron cargar categorías'), color: 'error' })
  }
}

function aplicarFiltros() {
  p.fetchAll()
}

function openCreate() {
  editing.value = null
  drawerOpen.value = true
}

function findBudget(row: PresupuestoRow): Budget | undefined {
  if (row.budgetId) {
    const b = p.items.value.find(x => x.id === row.budgetId)
    if (b) return b
  }
  return p.items.value.find(x => x.categoryId === row.categoryId)
}

function openEdit(row: PresupuestoRow) {
  const b = findBudget(row)
  if (!b) {
    toast.add({ title: 'Sin presupuesto', description: 'Crea el límite primero.', color: 'warning' })
    return
  }
  editing.value = b
  drawerOpen.value = true
}

function goDetail(row: PresupuestoRow) {
  const b = findBudget(row)
  if (!b) {
    toast.add({ title: 'Sin presupuesto', description: 'Crea el límite primero para ver el detalle.', color: 'warning' })
    return
  }
  navigateTo(`/presupuestos/${b.id}`)
}

async function handleDelete(row: PresupuestoRow) {
  const b = findBudget(row)
  if (!b) return
  await p.remove(b.id)
}

watch(search, (v) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    p.filter.buscar = v?.trim() ? v.trim() : undefined
  }, 300)
})

watch(() => dash.period.value, (per) => {
  p.setPeriod(per.year, per.month)
  recargar()
}, { deep: true })

onMounted(() => {
  p.setPeriod(dash.period.value.year, dash.period.value.month)
  recargar()
})
onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      v-model:search="search"
      title="Presupuestos"
      :description="`${periodLabel} · Planificado vs ejecutado por rubro`"
      icon="i-lucide-wallet"
      search-placeholder="Buscar rubro..."
      create-label="Nuevo presupuesto"
      @create="openCreate"
    >
      <template #actions>
        <UButton variant="outline" color="neutral" icon="i-lucide-copy" label="Copiar mes anterior" @click="p.copiarMesAnterior()" />
        <UButton variant="outline" color="neutral" icon="i-lucide-calendar-days" label="Calendario" to="/presupuestos/calendario" />
      </template>
    </AppToolbar>

    <AppStatCards :stats="stats" :loading="p.loading.value && !p.stats.value" :columns="4" />

    <PresupuestosFilters v-model:year="p.filter.year" v-model:month="p.filter.month" @filtrar="aplicarFiltros" />


    <PresupuestosTable
      :data="p.rows.value"
      :loading="p.loading.value"
      :currency="currency"
      @view="goDetail"
      @edit="openEdit"
      @delete="handleDelete"
    />

    <PresupuestosDrawer
      v-model:open="drawerOpen"
      :presupuesto="editing"
      :year="p.filter.year"
      :month="p.filter.month"
      :categorias="catOpts"
      @refresh="recargar"
    />
  </div>
</template>
