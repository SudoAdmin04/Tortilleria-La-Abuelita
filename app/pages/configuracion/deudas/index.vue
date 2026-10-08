
<script setup lang="ts">
import { listDebts, createDebt, updateDebt, deleteDebt, settleDebt, type Debt } from '~/services/debts.service'
import { formatMoney } from '~/utils/format'
import { getApiMessage } from '~/utils/api-error'


const auth = useAuthStore()
const permisos = usePermisosStore()
const toast = useToast()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/configuracion/deudas', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/configuracion/deudas', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/configuracion/deudas', 'canDelete'))

const items = ref<Debt[]>([])
const total = computed(() => items.value.length)
const status = ref<'open' | 'paid' | undefined>(undefined)
const drawer = ref(false)
const saving = ref(false)
const editId = ref<string | null>(null)
const form = reactive({ name: '', direction: 'payable', principalAmount: 0, counterparty: '', dueDate: '' })

async function recargar() {
  try {
    items.value = await listDebts(status.value)
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar'), color: 'error' })
  }
}

function abrirCrear() {
  editId.value = null
  Object.assign(form, { name: '', direction: 'payable', principalAmount: 0, counterparty: '', dueDate: '' })
  drawer.value = true
}

function abrirEditar(d: Debt) {
  editId.value = d.id
  Object.assign(form, { name: d.name, direction: d.direction, principalAmount: d.principalAmount, counterparty: d.counterparty || '', dueDate: d.dueDate || '' })
  drawer.value = true
}

async function guardar() {
  saving.value = true
  try {
    const payload: any = { name: form.name, direction: form.direction, principalAmount: Number(form.principalAmount), counterparty: form.counterparty || undefined, dueDate: form.dueDate || undefined }
    if (editId.value) await updateDebt(editId.value, payload)
    else await createDebt(payload)
    toast.add({ title: 'Guardado', color: 'success' })
    drawer.value = false
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo guardar'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function liquidar(d: Debt) {
  try {
    await settleDebt(d.id)
    toast.add({ title: 'Liquidada', color: 'success' })
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo liquidar'), color: 'error' })
  }
}

async function eliminar(d: Debt) {
  try {
    await deleteDebt(d.id)
    toast.add({ title: 'Eliminada', color: 'success' })
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo eliminar'), color: 'error' })
  }
}

onMounted(recargar)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Deudas</h1>
        <p class="text-sm text-slate-400">Por pagar y por cobrar · {{ total }}</p>
      </div>
      <div class="flex gap-2">
        <USelect v-model="status" :items="[{ value: undefined, label: 'Todas' }, { value: 'open', label: 'Vigentes' }, { value: 'paid', label: 'Liquidadas' }]" class="w-36" @change="recargar()" />
        <UButton v-if="puedeCrear" icon="i-lucide-plus" @click="abrirCrear()">Nueva deuda</UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard v-for="d in items" :key="d.id">
        <div class="flex justify-between gap-2">
          <div>
            <p class="font-semibold">{{ d.name }}</p>
            <p class="text-xs text-slate-400">{{ d.counterparty || '—' }} · {{ d.direction === 'payable' ? 'Yo debo' : 'Me deben' }}</p>
          </div>
          <UBadge :color="d.status === 'paid' ? 'success' : 'warning'" variant="soft">{{ d.status }}</UBadge>
        </div>
        <div class="mt-3 flex justify-between text-sm">
          <span>Principal: <strong>{{ formatMoney(d.principalAmount, currency) }}</strong></span>
          <span>Vivo: <strong>{{ formatMoney(d.outstanding, currency) }}</strong></span>
        </div>
        <UProgress :value="d.principalAmount ? Math.round((d.paidAmount / d.principalAmount) * 100) : 0" class="mt-2" />
        <div class="mt-3 flex gap-1 justify-end">
          <UButton v-if="puedeEditar && d.status === 'open'" size="xs" variant="soft" @click="liquidar(d)">Liquidar</UButton>
          <UButton v-if="puedeEditar" size="xs" variant="ghost" icon="i-lucide-pencil" @click="abrirEditar(d)" />
          <UButton v-if="puedeEliminar" size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="eliminar(d)" />
        </div>
      </UCard>
    </div>

    <USlideover v-model:open="drawer" title="Deuda">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="guardar">
          <UFormField label="Nombre" required><UInput v-model="form.name" class="w-full" /></UFormField>
          <UFormField label="Dirección" required>
            <USelect v-model="form.direction" :items="[{ value: 'payable', label: 'Yo debo (resta)' }, { value: 'receivable', label: 'Me deben (suma)' }]" class="w-full" />
          </UFormField>
          <UFormField label="Monto principal" required><UInput v-model="form.principalAmount" type="number" min="1" step="0.01" class="w-full" /></UFormField>
          <UFormField label="Contraparte"><UInput v-model="form.counterparty" class="w-full" /></UFormField>
          <UFormField label="Vencimiento"><UInput v-model="form.dueDate" type="date" class="w-full" /></UFormField>
          <UButton type="submit" block :loading="saving">{{ editId ? 'Actualizar' : 'Crear' }}</UButton>
        </UForm>
      </template>
    </USlideover>
  </div>
</template>



