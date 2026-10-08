
<script setup lang="ts">
import { listBudgets, createBudget, updateBudget, copyBudgets } from '~/services/budgets.service'
import { getBudgetOverview, type BudgetOverview } from '~/services/reports.service'
import { listCategories } from '~/services/categories.service'
import { formatMoney, formatExecution, monthYearLabel } from '~/utils/format'
import { getApiMessage } from '~/utils/api-error'

const auth = useAuthStore()
const permisos = usePermisosStore()
const toast = useToast()
const dash = useDashboardData()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/presupuestos', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/presupuestos', 'canUpdate'))

const loading = ref(false)
const saving = ref(false)
const drawer = ref(false)
const editId = ref<string | null>(null)
const overview = ref<BudgetOverview | null>(null)
const budgets = ref<any[]>([])
const catOpts = ref<{ value: string; label: string }[]>([])
const form = reactive({ categoryId: '', amount: 0, reason: '' })

const periodLabel = computed(() => monthYearLabel(dash.period.value.year, dash.period.value.month))
const totals = computed(() => (overview.value?.totals ?? {}) as any)
const rubros = computed(() => overview.value?.rubros ?? [])
const resumen = computed(() => `${rubros.value.length} rubros`)
import type { TableColumn } from '@nuxt/ui'
import type { components } from '~/types/api'

type Rubro = components['schemas']['BudgetLineResponseDto']

const cols: TableColumn<Rubro>[] = [
  { accessorKey: 'name', header: 'Rubro' },
  { accessorKey: 'budget', header: 'Ppto' },
  { accessorKey: 'actual', header: 'Real' },
  { accessorKey: 'executionRate', header: '% Ejec' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'actions', header: '' },
]

async function recargar() {
  loading.value = true
  try {
    const [ov, cats] = await Promise.all([
      getBudgetOverview({ year: dash.period.value.year, month: dash.period.value.month }),
      listCategories(false),
    ])
    overview.value = ov
    budgets.value = await listBudgets({ year: dash.period.value.year, month: dash.period.value.month })
    catOpts.value = (cats as any[]).filter(c => !c.parentId).map(c => ({ value: c.id, label: c.name }))
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar'), color: 'error' })
  } finally {
    loading.value = false
  }
}

function abrirCrear() {
  editId.value = null
  Object.assign(form, { categoryId: catOpts.value[0]?.value || '', amount: 0, reason: '' })
  drawer.value = true
}

function ajustar(row: any) {
  const b = budgets.value.find(x => x.categoryId === row.categoryId)
  if (!b) {
    toast.add({ title: 'Sin presupuesto', description: 'Crea el límite primero.', color: 'warning' })
    return
  }
  editId.value = b.id
  Object.assign(form, { categoryId: b.categoryId, amount: b.amount, reason: '' })
  drawer.value = true
}

async function guardar() {
  saving.value = true
  try {
    if (editId.value) await updateBudget(editId.value, { amount: Number(form.amount), reason: form.reason || undefined })
    else await createBudget({ categoryId: form.categoryId, year: dash.period.value.year, month: dash.period.value.month, amount: Number(form.amount) })
    toast.add({ title: 'Guardado', color: 'success' })
    drawer.value = false
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo guardar'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function copiar() {
  const from = new Date(dash.period.value.year, dash.period.value.month - 2, 1)
  try {
    const res = await copyBudgets({ fromYear: from.getFullYear(), fromMonth: from.getMonth() + 1, toYear: dash.period.value.year, toMonth: dash.period.value.month })
    toast.add({ title: 'Copiado', description: `${res.created} creados, ${res.skipped} omitidos`, color: 'success' })
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo copiar'), color: 'error' })
  }
}

watch(() => dash.period.value, recargar, { deep: true })
onMounted(recargar)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Presupuestos</h1>
        <p class="text-sm text-slate-400">{{ periodLabel }} · {{ resumen }}</p>
      </div>
      <div class="flex gap-2">
        <UButton variant="outline" color="neutral" icon="i-lucide-copy" @click="copiar()">Copiar mes anterior</UButton>
        <UButton v-if="puedeCrear" icon="i-lucide-plus" @click="abrirCrear()">Nuevo presupuesto</UButton>
      </div>
    </div>

    <UCard v-if="overview">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div><p class="text-xs text-slate-400">Planeado</p><p class="text-xl font-bold">{{ formatMoney(totals.planned, currency) }}</p></div>
        <div><p class="text-xs text-slate-400">Ejecutado</p><p class="text-xl font-bold">{{ formatMoney(totals.executed, currency) }}</p></div>
        <div><p class="text-xs text-slate-400">Restante</p><p class="text-xl font-bold">{{ formatMoney(totals.remaining, currency) }}</p></div>
        <div><p class="text-xs text-slate-400">Ejecución</p><p class="text-xl font-bold">{{ formatExecution(totals.executionRate) }}</p></div>
      </div>
    </UCard>

    <UCard>
      <UTable :data="rubros" :columns="cols" :loading="loading">
        <template #budget-cell="{ row }">{{ formatMoney(row.original.budget, currency) }}</template>
        <template #actual-cell="{ row }">{{ formatMoney(row.original.actual, currency) }}</template>
        <template #executionRate-cell="{ row }">{{ formatExecution(row.original.executionRate) }}</template>
        <template #status-cell="{ row }">
          <UBadge :color="row.original.status === 'exceeded' ? 'error' : row.original.status === 'near' ? 'warning' : 'success'" variant="soft">{{ row.original.status }}</UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton v-if="puedeEditar" size="xs" variant="ghost" icon="i-lucide-pencil" @click="ajustar(row.original)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <USlideover v-model:open="drawer" title="Presupuesto">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="guardar">
          <UFormField label="Categoría" required><USelect v-model="form.categoryId" :items="catOpts" class="w-full" /></UFormField>
          <UFormField label="Monto" required><UInput v-model="form.amount" type="number" min="1" step="0.01" class="w-full" /></UFormField>
          <UFormField v-if="editId" label="Motivo"><UInput v-model="form.reason" class="w-full" /></UFormField>
          <UButton type="submit" block :loading="saving">{{ editId ? 'Ajustar' : 'Crear' }}</UButton>
        </UForm>
      </template>
    </USlideover>
  </div>
</template>
