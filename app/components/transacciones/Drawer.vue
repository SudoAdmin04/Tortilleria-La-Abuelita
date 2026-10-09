<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/transacciones.schema'
import type { Transaction, CreateTransaction, UpdateTransaction } from '~/services/transactions.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  mov?: Transaction | null
  cuentas?: { value: string; label: string }[]
  categorias?: { value: string; label: string }[]
}>()
const emit = defineEmits(['refresh'])

const { create, update } = useTransacciones()
const isEditing = computed(() => !!props.mov)
const esTraspaso = computed(() => formState.type === 'transfer')

const schema = computed(() => (isEditing.value ? editSchema : createSchema))

function hoy(): string {
  return new Date().toISOString().slice(0, 10)
}

const formState = reactive({
  type: 'expense' as Transaction['type'],
  accountId: '',
  destinationAccountId: '',
  categoryId: '',
  amount: undefined as number | undefined,
  date: hoy(),
  concept: '',
  description: '',
  paymentMethod: '',
  status: 'pending' as Transaction['status'],
  reference: '',
})

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.mov) {
    Object.assign(formState, {
      type: props.mov.type,
      accountId: props.mov.accountId,
      destinationAccountId: props.mov.destinationAccountId || '',
      categoryId: props.mov.categoryId || '',
      amount: props.mov.amount,
      date: props.mov.date,
      concept: props.mov.concept,
      description: props.mov.description || '',
      paymentMethod: props.mov.paymentMethod || '',
      status: props.mov.status,
      reference: props.mov.reference || '',
    })
  } else {
    Object.assign(formState, {
      type: 'expense',
      accountId: props.cuentas?.[0]?.value || '',
      destinationAccountId: '',
      categoryId: '',
      amount: undefined,
      date: hoy(),
      concept: '',
      description: '',
      paymentMethod: '',
      status: 'pending',
      reference: '',
    })
  }
})

watch(() => formState.type, (t) => {
  if (t === 'transfer') formState.categoryId = ''
  else formState.destinationAccountId = ''
})

const tipoItems = [
  { value: 'income', label: 'Ingreso' },
  { value: 'expense', label: 'Egreso' },
  { value: 'transfer', label: 'Traspaso' },
]

const medioItems = [
  { value: '', label: '— Ninguno —' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'debit_card', label: 'Débito' },
  { value: 'credit_card', label: 'Crédito' },
  { value: 'bank_transfer', label: 'Transferencia' },
]

const estadoItems = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'reconciled', label: 'Conciliado' },
]

function cleanId(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined
}

function cleanText(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const payload = event.data
  const esTransfer = (payload.type ?? formState.type) === 'transfer'
  if (isEditing.value && props.mov) {
    const p = payload as EditSchema
    const body: UpdateTransaction = {
      type: p.type,
      accountId: p.accountId,
      amount: p.amount != null ? Number(p.amount) : undefined,
      date: p.date,
      concept: p.concept,
      status: p.status ?? formState.status,
      paymentMethod: cleanText(p.paymentMethod) as UpdateTransaction['paymentMethod'],
      description: cleanText(p.description),
      reference: cleanText(p.reference),
      ...(esTransfer
        ? { destinationAccountId: p.destinationAccountId }
        : { categoryId: p.categoryId }),
    }
    const r = await update(props.mov.id, body)
    if (!r) return
  } else {
    const p = payload as CreateSchema
    const body: CreateTransaction = {
      type: p.type,
      accountId: p.accountId,
      amount: Number(p.amount),
      date: p.date,
      concept: p.concept.trim(),
      status: 'pending',
      paymentMethod: cleanText(p.paymentMethod) as CreateTransaction['paymentMethod'],
      description: cleanText(p.description),
      reference: cleanText(p.reference),
      ...(esTransfer
        ? { destinationAccountId: p.destinationAccountId }
        : { categoryId: p.categoryId }),
    }
    const r = await create(body)
    if (!r) return
  }
  open.value = false
  emit('refresh')
}
</script>

<template>
  <UDrawer direction="right" v-model:open="open" :dismissible="false" :handle="false">
    <template #content>
      <div class="flex flex-col w-150 h-full ">

        <div class="bg-white/[0.02] p-6 pb-4 flex flex-col gap-4 shrink-0 border-b border-neutral-700">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-500 shrink-0">
                <UIcon name="i-lucide-arrow-left-right" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  {{ isEditing ? 'Editar Movimiento' : 'Registrar Movimiento' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ isEditing ? 'Actualiza los datos del movimiento' : 'Registra un ingreso, egreso o traspaso' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="tx-form" :schema="schema" :state="formState" class="space-y-8" @submit="onSave">

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Tipo y Cuentas
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Tipo" name="type" required>
                  <USelectMenu
                    v-model="formState.type"
                    :items="tipoItems"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Cuenta origen" name="accountId" required>
                  <USelectMenu
                    v-model="formState.accountId"
                    :items="props.cuentas ?? []"
                    value-key="value"
                    label-key="label"
                    placeholder="Selecciona la cuenta origen"
                    class="w-full"
                  />
                </UFormField>
                <UFormField v-if="esTraspaso" label="Cuenta destino" name="destinationAccountId" required hint="Debe ser distinta a la origen">
                  <USelectMenu
                    v-model="formState.destinationAccountId"
                    :items="props.cuentas ?? []"
                    value-key="value"
                    label-key="label"
                    placeholder="Selecciona la cuenta destino"
                    class="w-full"
                  />
                </UFormField>
                <UFormField v-else label="Categoría" name="categoryId" required>
                  <USelectMenu
                    v-model="formState.categoryId"
                    :items="props.categorias ?? []"
                    value-key="value"
                    label-key="label"
                    placeholder="Selecciona la categoría"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

            <USeparator />

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">2</span>
                Detalle del Movimiento
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Monto" name="amount" required hint="Siempre positivo">
                    <UInput v-model="formState.amount" type="number" min="0.01" step="0.01" placeholder="850.75" class="w-full" />
                  </UFormField>
                  <UFormField label="Fecha contable" name="date" required>
                    <UInput v-model="formState.date" type="date" class="w-full" />
                  </UFormField>
                </div>
                <UFormField label="Concepto" name="concept" required>
                  <UInput v-model="formState.concept" placeholder="Ej. Súper semanal" class="w-full" />
                </UFormField>
                <UFormField label="Descripción" name="description" hint="Detalle largo (opcional)">
                  <UTextarea v-model="formState.description" placeholder="Compra en supermercado..." class="w-full" />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Medio de pago" name="paymentMethod">
                    <USelectMenu
                      v-model="formState.paymentMethod"
                      :items="medioItems"
                      value-key="value"
                      label-key="label"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Referencia" name="reference" hint="Folio (opcional)">
                    <UInput v-model="formState.reference" placeholder="TICKET-123" class="w-full" />
                  </UFormField>
                </div>
                <UFormField v-if="isEditing" label="Estado" name="status" hint="Conciliar ajusta la fecha de conciliación">
                  <USelectMenu
                    v-model="formState.status"
                    :items="estadoItems"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

          </UForm>
        </div>

        <div class="bg-white/[0.02] flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-neutral-700">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="tx-form" color="primary" variant="solid" :label="isEditing ? 'Guardar Cambios' : 'Registrar Movimiento'" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
