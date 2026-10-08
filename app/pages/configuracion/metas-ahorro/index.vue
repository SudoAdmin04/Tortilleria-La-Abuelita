

<script setup lang="ts">
import { listSavingsGoals, savingsProgress, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, type SavingsGoal, type GoalProgress } from '~/services/savings-goals.service'
import { listAccounts } from '~/services/accounts.service'
import { listCategories } from '~/services/categories.service'
import { formatMoney, monthYearLabel } from '~/utils/format'
import { getApiMessage } from '~/utils/api-error'

const auth = useAuthStore()
const permisos = usePermisosStore()
const toast = useToast()
const dash = useDashboardData()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/configuracion/metas-ahorro', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/configuracion/metas-ahorro', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/configuracion/metas-ahorro', 'canDelete'))

const progress = ref<GoalProgress[]>([])
const cuentasOpts = ref<{ value: string; label: string }[]>([])
const catsOpts = ref<{ value: string; label: string }[]>([])
const drawer = ref(false)
const saving = ref(false)
const editId = ref<string | null>(null)
const form = reactive({ name: '', monthlyContribution: 0, targetAmount: '', accountId: '', categoryId: '' })
const periodLabel = computed(() => monthYearLabel(dash.period.value.year, dash.period.value.month))

async function recargar() {
  try {
    const [prog, acc, cats] = await Promise.all([
      savingsProgress({ year: dash.period.value.year, month: dash.period.value.month }),
      listAccounts(),
      listCategories(false),
    ])
    progress.value = prog
    cuentasOpts.value = (acc as any[]).map(a => ({ value: a.id, label: a.name }))
    catsOpts.value = (cats as any[]).map(c => ({ value: c.id, label: c.name }))
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar'), color: 'error' })
  }
}

function abrirCrear() {
  editId.value = null
  Object.assign(form, { name: '', monthlyContribution: 0, targetAmount: '', accountId: '', categoryId: '' })
  drawer.value = true
}

function abrirEditar(g: SavingsGoal) {
  editId.value = g.id
  Object.assign(form, { name: g.name, monthlyContribution: g.monthlyContribution, targetAmount: g.targetAmount || '', accountId: g.accountId || '', categoryId: g.categoryId || '' })
  drawer.value = true
}

async function guardar() {
  saving.value = true
  try {
    const payload: any = { name: form.name, monthlyContribution: Number(form.monthlyContribution), targetAmount: form.targetAmount ? Number(form.targetAmount) : undefined, accountId: form.accountId || undefined, categoryId: form.categoryId || undefined }
    if (editId.value) await updateSavingsGoal(editId.value, payload)
    else await createSavingsGoal(payload)
    toast.add({ title: 'Guardado', color: 'success' })
    drawer.value = false
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo guardar'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function eliminar(id: string) {
  try {
    await deleteSavingsGoal(id)
    toast.add({ title: 'Eliminada', color: 'success' })
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo eliminar'), color: 'error' })
  }
}

watch(() => dash.period.value, recargar, { deep: true })
onMounted(recargar)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Metas de ahorro</h1>
        <p class="text-sm text-slate-400">{{ periodLabel }} · avance del mes</p>
      </div>
      <UButton v-if="puedeCrear" icon="i-lucide-plus" @click="abrirCrear()">Nueva meta</UButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard v-for="p in progress" :key="p.goal.id">
        <div class="flex justify-between gap-2">
          <p class="font-semibold">{{ p.goal.name }}</p>
          <UBadge :color="(p.percent || 0) >= 100 ? 'success' : 'primary'" variant="soft">{{ p.percent ?? '—' }}%</UBadge>
        </div>
        <p class="text-sm text-slate-400 mt-1">{{ formatMoney(p.contributed, currency) }} de {{ formatMoney(p.monthlyTarget, currency) }}</p>
        <UProgress :value="Math.min(100, Math.round(p.percent || 0))" class="mt-2" />
        <div class="mt-3 flex gap-1 justify-end">
          <UButton v-if="puedeEditar" size="xs" variant="ghost" icon="i-lucide-pencil" @click="abrirEditar(p.goal)" />
          <UButton v-if="puedeEliminar" size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="eliminar(p.goal.id)" />
        </div>
      </UCard>
    </div>

    <USlideover v-model:open="drawer" title="Meta de ahorro">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="guardar">
          <UFormField label="Nombre" required><UInput v-model="form.name" class="w-full" /></UFormField>
          <UFormField label="Aporte mensual" required><UInput v-model="form.monthlyContribution" type="number" min="1" step="0.01" class="w-full" /></UFormField>
          <UFormField label="Objetivo total"><UInput v-model="form.targetAmount" type="number" min="0" step="0.01" class="w-full" /></UFormField>
          <UFormField label="Cuenta"><USelect v-model="form.accountId" :items="[{ value: '', label: '— Ninguna —' }, ...cuentasOpts]" class="w-full" /></UFormField>
          <UFormField label="Categoría (egresos que cuentan)"><USelect v-model="form.categoryId" :items="[{ value: '', label: '— Ninguna —' }, ...catsOpts]" class="w-full" /></UFormField>
          <UButton type="submit" block :loading="saving">{{ editId ? 'Actualizar' : 'Crear' }}</UButton>
        </UForm>
      </template>
    </USlideover>
  </div>
</template>


