<script setup lang="ts">
import { listAccounts } from '~/services/accounts.service'
import { listCategories } from '~/services/categories.service'
import { createTransaction } from '~/services/transactions.service'
import { getApiMessage } from '~/utils/api-error'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ created: [] }>()

const toast = useToast()
const saving = ref(false)
const catalogsLoading = ref(false)

const cuentasOpts = ref<{ value: string, label: string }[]>([])
const categoriasOpts = ref<{ value: string, label: string }[]>([])
const form = reactive({
  type: 'expense',
  accountId: '',
  destinationAccountId: '',
  categoryId: '',
  amount: 0 as number | null,
  date: new Date().toISOString().slice(0, 10),
  concept: '',
  paymentMethod: 'cash',
})

async function loadCatalogs() {
  if (cuentasOpts.value.length) return
  catalogsLoading.value = true
  try {
    const [acc, cat] = await Promise.all([listAccounts(), listCategories(false)])
    cuentasOpts.value = (acc as any[]).map(a => ({ value: a.id, label: a.name }))
    categoriasOpts.value = (cat as any[]).map(c => ({ value: c.id, label: c.parentId ? `— ${c.name}` : c.name }))
    if (!form.accountId) form.accountId = cuentasOpts.value[0]?.value ?? ''
  } catch {}
  finally { catalogsLoading.value = false }
}

watch(open, v => { if (v) loadCatalogs() })

async function save() {
  if (!form.accountId || !form.concept.trim() || !form.amount || Number(form.amount) <= 0) {
    toast.add({ title: 'Revisa el formulario', description: 'Cuenta, concepto y monto mayor a 0 son obligatorios.', color: 'warning' })
    return
  }
  saving.value = true
  try {
    const payload: any = {
      type: form.type,
      accountId: form.accountId,
      amount: Number(form.amount),
      date: form.date,
      concept: form.concept.trim(),
      paymentMethod: form.paymentMethod,
      status: 'pending',
    }
    if (form.type === 'transfer') payload.destinationAccountId = form.destinationAccountId
    else payload.categoryId = form.categoryId
    await createTransaction(payload)
    toast.add({ title: 'Transacción registrada', color: 'success' })
    open.value = false
    Object.assign(form, { type: 'expense', destinationAccountId: '', categoryId: '', amount: 0, concept: '', date: new Date().toISOString().slice(0, 10) })
    await refreshNuxtData('dashboard-report')
    emit('created')
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo registrar'), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <USlideover v-model:open="open" title="Registrar transacción">
    <template #body>
      <UForm :state="form" class="space-y-4" @submit="save">
        <UFormField label="Tipo" required>
          <USelect
            v-model="form.type"
            :items="[{ value: 'income', label: 'Ingreso' }, { value: 'expense', label: 'Egreso' }, { value: 'transfer', label: 'Traspaso' }]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Cuenta origen" required>
          <USelect v-model="form.accountId" :items="cuentasOpts" :loading="catalogsLoading" class="w-full" />
        </UFormField>
        <UFormField v-if="form.type === 'transfer'" label="Cuenta destino" required>
          <USelect v-model="form.destinationAccountId" :items="cuentasOpts" class="w-full" />
        </UFormField>
        <UFormField v-else label="Categoría" required>
          <USelect v-model="form.categoryId" :items="categoriasOpts" :loading="catalogsLoading" class="w-full" />
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
          <USelect
            v-model="form.paymentMethod"
            :items="[{ value: 'cash', label: 'Efectivo' }, { value: 'debit_card', label: 'Débito' }, { value: 'credit_card', label: 'Crédito' }, { value: 'bank_transfer', label: 'Transferencia' }]"
            class="w-full"
          />
        </UFormField>
        <UButton type="submit" block :loading="saving">Registrar</UButton>
      </UForm>
    </template>
  </USlideover>
</template>
