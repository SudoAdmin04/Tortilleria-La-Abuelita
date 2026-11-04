<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, type CreateSchema } from '~/schemas/compras.schema'
import type { CreatePurchase } from '~/services/purchases.service'
import type { Supplier } from '~/services/suppliers.service'
import type { Supply } from '~/services/supplies.service'
import type { Account } from '~/services/accounts.service'
import { listAccounts } from '~/services/accounts.service'
import { formatMoney } from '~/utils/format'
import { toISODate } from '~/utils/date-range'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ currency?: string }>()
const emit = defineEmits<{ refresh: [] }>()

const { create, saving } = useCompras()
const { fetchAll: fetchProveedores } = useProveedores()
const { fetchAll: fetchInsumos } = useInsumos()

const cargando = ref(false)
const proveedores = ref<Supplier[]>([])
const insumos = ref<Supply[]>([])
const cuentas = ref<Account[]>([])

const moneda = computed(() => props.currency || 'MXN')

const metodosPagoItems = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'debit_card', label: 'Tarjeta de débito' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'bank_transfer', label: 'Transferencia' },
]

const proveedorItems = computed(() => proveedores.value
  .filter(p => p.isActive)
  .map(p => ({ value: p.id, label: p.name })))

const insumoItems = computed(() => insumos.value
  .filter(s => s.isActive)
  .map(s => ({ value: s.id, label: `${s.name} (${s.unit})` })))

const cuentaItems = computed(() => cuentas.value
  .filter(c => c.isActive)
  .map(c => ({ value: c.id, label: `${c.name} · ${formatMoney(c.balance, moneda.value)}` })))

const formState = reactive<CreateSchema>({
  supplierId: '',
  accountId: '',
  date: toISODate(new Date()),
  invoiceNumber: '',
  paymentMethod: undefined,
  tax: 0,
  notes: '',
  items: [{ supplyId: '', quantity: 1, unitCost: 0 }],
})

watch(open, async (isOpen) => {
  if (!isOpen) return
  Object.assign(formState, {
    supplierId: '',
    accountId: '',
    date: toISODate(new Date()),
    invoiceNumber: '',
    paymentMethod: undefined,
    tax: 0,
    notes: '',
    items: [{ supplyId: '', quantity: 1, unitCost: 0 }],
  })
  cargando.value = true
  try {
    const [proveedoresData, insumosData, cuentasData] = await Promise.all([
      fetchProveedores(),
      fetchInsumos(),
      listAccounts().catch(() => [] as Account[]),
    ])
    proveedores.value = proveedoresData
    insumos.value = insumosData
    cuentas.value = cuentasData
  } finally {
    cargando.value = false
  }
})

function insumoDe(id: string): Supply | undefined {
  return insumos.value.find(s => s.id === id)
}

function alElegirInsumo(index: number) {
  const item = formState.items[index]
  if (!item) return
  const insumo = insumoDe(item.supplyId)
  if (insumo && !Number(item.unitCost)) item.unitCost = insumo.averageCost || insumo.lastCost || 0
}

const subtotal = computed(() => formState.items.reduce(
  (total, item) => total + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
  0,
))

const total = computed(() => subtotal.value + (Number(formState.tax) || 0))

function agregarRenglon() {
  formState.items.push({ supplyId: '', quantity: 1, unitCost: 0 })
}

function quitarRenglon(index: number) {
  if (formState.items.length === 1) return
  formState.items.splice(index, 1)
}

const onSave = async (event: FormSubmitEvent<CreateSchema>) => {
  const data = event.data
  const body: CreatePurchase = {
    supplierId: data.supplierId,
    accountId: data.accountId,
    date: data.date,
    invoiceNumber: data.invoiceNumber,
    paymentMethod: data.paymentMethod,
    tax: Number(data.tax) || 0,
    notes: data.notes,
    items: data.items.map(i => ({
      supplyId: i.supplyId,
      quantity: Number(i.quantity),
      unitCost: Number(i.unitCost),
    })),
  }
  const result = await create(body)
  if (!result) return
  open.value = false
  emit('refresh')
}
</script>

<template>
  <UDrawer direction="right" v-model:open="open" :dismissible="false" :handle="false">
    <template #content>
      <div class="flex flex-col w-150 h-full">
        <div class="bg-elevated/60 p-6 pb-4 flex flex-col gap-4 shrink-0 border-b border-default">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary shrink-0">
                <UIcon name="i-lucide-shopping-cart" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">Registrar Compra</h3>
                <p class="text-xs text-muted">
                  La compra aumenta el stock y registra el egreso en la cuenta
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <div v-if="cargando" class="flex flex-col gap-3 animate-pulse">
            <div v-for="n in 5" :key="n" class="h-10 rounded-lg bg-elevated" />
          </div>

          <UForm v-else id="compra-form" :schema="createSchema" :state="formState" class="space-y-6" @submit="onSave">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Proveedor" name="supplierId">
                <USelectMenu
                  v-model="formState.supplierId"
                  :items="proveedorItems"
                  value-key="value"
                  label-key="label"
                  placeholder="Selecciona un proveedor"
                  icon="i-lucide-building-2"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Cuenta de pago" name="accountId">
                <USelectMenu
                  v-model="formState.accountId"
                  :items="cuentaItems"
                  value-key="value"
                  label-key="label"
                  placeholder="Selecciona una cuenta"
                  icon="i-lucide-landmark"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Fecha" name="date">
                <UInput v-model="formState.date" type="date" class="w-full" />
              </UFormField>
              <UFormField label="Factura / remisión" name="invoiceNumber">
                <UInput v-model="formState.invoiceNumber" placeholder="FAC-00231" class="w-full" />
              </UFormField>
              <UFormField label="Forma de pago" name="paymentMethod" class="sm:col-span-2">
                <USelectMenu
                  v-model="formState.paymentMethod"
                  :items="metodosPagoItems"
                  value-key="value"
                  label-key="label"
                  placeholder="Opcional"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-bold text-highlighted">Insumos comprados</span>
                <UButton
                  type="button"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-plus"
                  label="Agregar renglón"
                  @click="agregarRenglon"
                />
              </div>

              <div
                v-for="(item, index) in formState.items"
                :key="index"
                class="grid grid-cols-1 sm:grid-cols-[1fr_5rem_6rem_2rem] gap-2 items-end rounded-xl border border-default bg-elevated/60 p-3"
              >
                <UFormField :label="index === 0 ? 'Insumo' : undefined" :name="`items.${index}.supplyId`">
                  <USelectMenu
                    v-model="item.supplyId"
                    :items="insumoItems"
                    value-key="value"
                    label-key="label"
                    placeholder="Selecciona un insumo"
                    class="w-full"
                    @update:model-value="alElegirInsumo(index)"
                  />
                </UFormField>
                <UFormField :label="index === 0 ? 'Cantidad' : undefined" :name="`items.${index}.quantity`">
                  <UInput v-model="item.quantity" type="number" min="0.0001" step="0.01" class="w-full" />
                </UFormField>
                <UFormField :label="index === 0 ? 'Costo unit.' : undefined" :name="`items.${index}.unitCost`">
                  <UInput v-model="item.unitCost" type="number" min="0" step="0.01" class="w-full" />
                </UFormField>
                <UButton
                  type="button"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  class="mb-0.5 text-muted hover:text-red-600 dark:hover:text-red-400"
                  :disabled="formState.items.length === 1"
                  aria-label="Quitar renglón"
                  @click="quitarRenglon(index)"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Impuestos (monto)" name="tax">
                <UInput v-model="formState.tax" type="number" min="0" step="0.01" class="w-full" />
              </UFormField>
              <UFormField label="Notas" name="notes">
                <UInput v-model="formState.notes" placeholder="Compra semanal" class="w-full" />
              </UFormField>
            </div>

            <div class="rounded-xl border border-default bg-elevated/60 p-4 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">Subtotal</span>
                <span class="text-highlighted">{{ formatMoney(subtotal, moneda) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">Impuestos</span>
                <span class="text-highlighted">{{ formatMoney(Number(formState.tax) || 0, moneda) }}</span>
              </div>
              <div class="flex items-center justify-between border-t border-default pt-2">
                <span class="text-xs uppercase tracking-widest text-muted">Total</span>
                <span class="text-lg font-bold text-highlighted">{{ formatMoney(total, moneda) }}</span>
              </div>
            </div>
          </UForm>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="compra-form" color="primary" :loading="saving" label="Registrar Compra" />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
