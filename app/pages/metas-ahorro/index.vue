<script setup lang="ts">
import { listAccounts } from '~/services/accounts.service'
import { listCategories } from '~/services/categories.service'
import type { SavingsGoal } from '~/services/savings-goals.service'
import { monthYearLabel, formatMoney, formatExecution } from '~/utils/format'

const { items, metas, total, loading, resumen, fetchPaginado, remove, filter } = useMetasAhorro()
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

const movimientoOpen = ref(false)
const movimientoTipo = ref<'deposit' | 'withdraw'>('deposit')
const movimientoMeta = ref<SavingsGoal | null>(null)
const historialOpen = ref(false)
const historialGoalId = ref<string | null>(null)
const historialGoalName = computed(() =>
  metas.value.find(m => m.id === historialGoalId.value)?.name
  || items.value.find(p => p.goal.id === historialGoalId.value)?.goal.name
  || null,
)

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

function findMeta(id: string): SavingsGoal | null {
  return metas.value.find(m => m.id === id)
    || items.value.find(p => p.goal.id === id)?.goal
    || null
}

function openCreate() {
  editingMeta.value = null
  formDrawerOpen.value = true
}

function openEdit(id: string) {
  editingMeta.value = findMeta(id)
  formDrawerOpen.value = true
}

function openMovimiento(id: string, tipo: 'deposit' | 'withdraw') {
  movimientoMeta.value = findMeta(id)
  if (!movimientoMeta.value) return
  movimientoTipo.value = tipo
  movimientoOpen.value = true
}

function openHistorial(id: string) {
  historialGoalId.value = id
  historialOpen.value = true
}

async function handleDelete(id: string) {
  await remove(id)
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
    catsOpts.value = toArray<any>(cats).map(c => ({ value: c.id, label: c.name }))
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

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard class="border border-white/10">
        <div class="flex flex-col gap-1">
          <span class="text-xs text-white/50 font-medium">Metas activas</span>
          <span class="text-xl font-bold text-white">{{ resumen.activas }} <span class="text-sm font-medium text-white/40">/ {{ resumen.totalMetas }}</span></span>
          <span class="text-xs text-white/40">{{ resumen.metasCompletadas }} de {{ resumen.metasConObjetivo }} con objetivo completadas</span>
        </div>
      </UCard>
      <UCard class="border border-white/10">
        <div class="flex flex-col gap-1.5">
          <span class="text-xs text-white/50 font-medium">Objetivo final total</span>
          <span class="text-xl font-bold text-white">{{ resumen.totalObjetivo > 0 ? formatMoney(resumen.totalObjetivo, currency) : '—' }}</span>
          <span class="text-xs text-white/40">Ahorrado: {{ formatMoney(resumen.ahorradoConObjetivo, currency) }}</span>
          <UProgress v-if="resumen.totalObjetivo > 0" :model-value="Math.min(100, Math.max(0, Math.round(resumen.pctObjetivo ?? 0)))" :max="100" />
          <span v-else class="text-xs text-white/40">Sin objetivo definido</span>
        </div>
      </UCard>
      <UCard class="border border-white/10">
        <div class="flex flex-col gap-1">
          <span class="text-xs text-white/50 font-medium">Avance al objetivo</span>
          <span class="text-xl font-bold text-white">{{ formatExecution(resumen.pctObjetivo) }}</span>
          <span class="text-xs text-white/40">
            {{ resumen.totalObjetivo > 0 ? `Faltan ${formatMoney(resumen.faltanteObjetivo, currency)}` : 'Define un targetAmount por meta' }}
          </span>
        </div>
      </UCard>
      <UCard class="border border-white/10">
        <div class="flex flex-col gap-1">
          <span class="text-xs text-white/50 font-medium">Aportado en {{ periodLabel }}</span>
          <span class="text-xl font-bold text-white">{{ formatMoney(resumen.aportadoMes, currency) }}</span>
          <span class="text-xs text-white/40">Mensual: {{ formatMoney(resumen.metaMes, currency) }} · {{ formatExecution(resumen.pctMes) }}</span>
        </div>
      </UCard>
    </div>

    <MetasAhorroList
      :data="items"
      :loading="loading"
      :total="total"
      :currency="currency"
      :cuentas="cuentasOpts"
      :categorias="catsOpts"
      v-model:page="page"
      v-model:pageCount="pageCount"
      @edit="openEdit"
      @delete="handleDelete"
      @deposit="(id: string) => openMovimiento(id, 'deposit')"
      @withdraw="(id: string) => openMovimiento(id, 'withdraw')"
      @history="openHistorial"
    />

    <MetasAhorroDrawer
      v-model:open="formDrawerOpen"
      :meta="editingMeta"
      :cuentas="cuentasOpts"
      :categorias="catsOpts"
      @refresh="fetchPaginado"
    />

    <MetasAhorroMovimiento
      v-model:open="movimientoOpen"
      :goal="movimientoMeta"
      :tipo="movimientoTipo"
      :cuentas="cuentasOpts"
      @saved="fetchPaginado"
    />

    <MetasAhorroHistorial
      v-model:open="historialOpen"
      :goal-id="historialGoalId"
      :goal-name="historialGoalName"
      :currency="currency"
      @changed="fetchPaginado"
    />
  </div>
</template>
