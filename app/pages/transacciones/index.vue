
<script setup lang="ts">
import { listTransactions, createTransaction, updateTransaction, deleteTransaction, type Transaction } from '~/services/transactions.service'
import { listAccounts } from '~/services/accounts.service'
import { listCategories } from '~/services/categories.service'
import { formatMoney } from '~/utils/format'
import { getApiMessage } from '~/utils/api-error'


const auth = useAuthStore()
const permisos = usePermisosStore()
const toast = useToast()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/transacciones', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/transacciones', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/transacciones', 'canDelete'))

const items = ref<Transaction[]>([])
const total = ref(0)
const pages = ref(1)
const loading = ref(false)
const drawer = ref(false)
const saving = ref(false)
const editId = ref<string | null>(null)

const filtros = reactive({ page: 1, limit: 20, type: undefined as string | undefined, status: undefined as string | undefined, search: '' })
const tipoOpts = [{ value: undefined, label: 'Todos' }, { value: 'income', label: 'Ingreso' }, { value: 'expense', label: 'Egreso' }, { value: 'transfer', label: 'Traspaso' }]
const statusOpts = [{ value: undefined, label: 'Todos' }, { value: 'pending', label: 'Pendiente' }, { value: 'reconciled', label: 'Conciliado' }]

import type { TableColumn } from '@nuxt/ui'

const cols: TableColumn<Transaction>[] = [
  { accessorKey: 'date', header: 'Fecha' },
  { accessorKey: 'concept', header: 'Concepto' },
  { accessorKey: 'type', header: 'Tipo' },
  { accessorKey: 'amount', header: 'Monto' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'actions', header: '' },
]

const cuentasOpts = ref<{ value: string; label: string }[]>([])
const categoriasOpts = ref<{ value: string; label: string }[]>([])
const form = reactive({ type: 'expense', accountId: '', destinationAccountId: '', categoryId: '', amount: 0, date: new Date().toISOString().slice(0, 10), concept: '', paymentMethod: 'cash' as any })

async function cargarCatalogos() {
  try {
    const [acc, cat] = await Promise.all([listAccounts(), listCategories(false)])
    cuentasOpts.value = (acc as any[]).map(a => ({ value: a.id, label: a.name }))
    categoriasOpts.value = (cat as any[]).map(c => ({ value: c.id, label: c.parentId ? `— ${c.name}` : c.name }))
  } catch {}
}

async function recargar() {
  loading.value = true
  try {
    const res = await listTransactions({ page: filtros.page, limit: filtros.limit, type: filtros.type as any, status: filtros.status as any, search: filtros.search || undefined })
    items.value = res.items
    total.value = res.total
    pages.value = res.pages
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar'), color: 'error' })
  } finally {
    loading.value = false
  }
}

function abrirCrear() {
  editId.value = null
  Object.assign(form, { type: 'expense', accountId: cuentasOpts.value[0]?.value || '', destinationAccountId: '', categoryId: '', amount: 0, date: new Date().toISOString().slice(0, 10), concept: '', paymentMethod: 'cash' })
  drawer.value = true
}

function abrirEditar(row: Transaction) {
  editId.value = row.id
  Object.assign(form, { type: row.type, accountId: row.accountId, destinationAccountId: row.destinationAccountId || '', categoryId: row.categoryId || '', amount: row.amount, date: row.date, concept: row.concept, paymentMethod: row.paymentMethod || 'cash' })
  drawer.value = true
}

async function guardar() {
  saving.value = true
  try {
    const payload: any = { type: form.type, accountId: form.accountId, amount: Number(form.amount), date: form.date, concept: form.concept, paymentMethod: form.paymentMethod, status: 'pending' }
    if (form.type === 'transfer') payload.destinationAccountId = form.destinationAccountId
    else payload.categoryId = form.categoryId
    if (editId.value) await updateTransaction(editId.value, payload)
    else await createTransaction(payload)
    toast.add({ title: 'Guardado', color: 'success' })
    drawer.value = false
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo guardar'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function eliminar(row: Transaction) {
  try {
    await deleteTransaction(row.id)
    toast.add({ title: 'Eliminado', color: 'success' })
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo eliminar'), color: 'error' })
  }
}

onMounted(async () => {
  await cargarCatalogos()
  await recargar()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Transacciones</h1>
        <p class="text-sm text-slate-400">Ingresos, egresos y traspasos · {{ total }} registros</p>
      </div>
      <UButton v-if="puedeCrear" icon="i-lucide-plus" @click="abrirCrear()">Registrar movimiento</UButton>
    </div>

    <UCard>
      <div class="flex flex-wrap gap-2 mb-4">
        <USelect v-model="filtros.type" :items="tipoOpts" placeholder="Tipo" class="w-40" @change="recargar()" />
        <USelect v-model="filtros.status" :items="statusOpts" placeholder="Estado" class="w-40" @change="recargar()" />
        <UInput v-model="filtros.search" icon="i-lucide-search" placeholder="Buscar concepto..." class="max-w-64" @change="recargar()" />
        <UButton variant="ghost" color="neutral" icon="i-lucide-refresh-cw" :loading="loading" @click="recargar()" />
      </div>

      <UTable :data="items" :columns="cols" :loading="loading">
        <template #type-cell="{ row }">
          <UBadge :color="row.original.type === 'income' ? 'success' : row.original.type === 'expense' ? 'error' : 'info'" variant="soft">
            {{ row.original.type }}
          </UBadge>
        </template>
        <template #amount-cell="{ row }">
          <span class="font-semibold">{{ formatMoney(row.original.amount, currency) }}</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="row.original.status === 'reconciled' ? 'success' : 'warning'" variant="soft">{{ row.original.status }}</UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton v-if="puedeEditar" size="xs" variant="ghost" icon="i-lucide-pencil" @click="abrirEditar(row.original)" />
            <UButton v-if="puedeEliminar" size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="eliminar(row.original)" />
          </div>
        </template>
      </UTable>

      <div class="flex items-center justify-between mt-4">
        <UPagination v-model="filtros.page" :total="total" :per-page="filtros.limit" @update:model-value="recargar()" />
        <span class="text-xs text-slate-500">Página {{ filtros.page }} de {{ pages }}</span>
      </div>
    </UCard>

    <USlideover v-model:open="drawer" title="Movimiento">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="guardar">
          <UFormField label="Tipo" required>
            <USelect v-model="form.type" :items="[{ value: 'income', label: 'Ingreso' }, { value: 'expense', label: 'Egreso' }, { value: 'transfer', label: 'Traspaso' }]" class="w-full" />
          </UFormField>
          <UFormField label="Cuenta origen" required>
            <USelect v-model="form.accountId" :items="cuentasOpts" class="w-full" />
          </UFormField>
          <UFormField v-if="form.type === 'transfer'" label="Cuenta destino" required>
            <USelect v-model="form.destinationAccountId" :items="cuentasOpts" class="w-full" />
          </UFormField>
          <UFormField v-else label="Categoría" required>
            <USelect v-model="form.categoryId" :items="categoriasOpts" class="w-full" />
          </UFormField>
          <UFormField label="Monto" required>
            <UInput v-model="form.amount" type="number" min="0.01" step="0.01" class="w-full" />
          </UFormField>
          <UFormField label="Fecha" required>
            <UInput v-model="form.date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Concepto" required>
            <UInput v-model="form.concept" placeholder="Súper semanal" class="w-full" />
          </UFormField>
          <UFormField label="Medio de pago">
            <USelect v-model="form.paymentMethod" :items="[{ value: 'cash', label: 'Efectivo' }, { value: 'debit_card', label: 'Débito' }, { value: 'credit_card', label: 'Crédito' }, { value: 'bank_transfer', label: 'Transferencia' }]" class="w-full" />
          </UFormField>
          <UButton type="submit" block :loading="saving">{{ editId ? 'Actualizar' : 'Crear' }}</UButton>
        </UForm>
      </template>
    </USlideover>
  </div>
</template>
