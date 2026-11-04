<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, type CreateSchema } from '~/schemas/ventas.schema'
import type { CreateSale } from '~/services/sales.service'
import type { Product } from '~/services/products.service'
import type { Account } from '~/services/accounts.service'
import { listAccounts } from '~/services/accounts.service'
import { formatMoney } from '~/utils/format'
import { toISODate } from '~/utils/date-range'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ currency?: string }>()
const emit = defineEmits<{ refresh: [] }>()

const { create, saving } = useVentas()
const { fetchAll: fetchProductos } = useProductos()

const cargando = ref(false)
const productos = ref<Product[]>([])
const cuentas = ref<Account[]>([])

const moneda = computed(() => props.currency || 'MXN')

const metodosPagoItems = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'debit_card', label: 'Tarjeta de débito' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'bank_transfer', label: 'Transferencia' },
]

const productoItems = computed(() => productos.value
  .filter(p => p.isActive)
  .map(p => ({ value: p.id, label: `${p.name} · ${formatMoney(p.price, moneda.value)}` })))

const cuentaItems = computed(() => cuentas.value
  .filter(c => c.isActive)
  .map(c => ({ value: c.id, label: `${c.name} · ${formatMoney(c.balance, moneda.value)}` })))

const formState = reactive<CreateSchema>({
  accountId: '',
  date: toISODate(new Date()),
  customerName: '',
  paymentMethod: undefined,
  discount: 0,
  notes: '',
  items: [{ productId: '', quantity: 1, unitPrice: undefined }],
})

watch(open, async (isOpen) => {
  if (!isOpen) return
  Object.assign(formState, {
    accountId: '',
    date: toISODate(new Date()),
    customerName: '',
    paymentMethod: undefined,
    discount: 0,
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: undefined }],
  })
  cargando.value = true
  try {
    const [productosData, cuentasData] = await Promise.all([
      fetchProductos(),
      listAccounts().catch(() => [] as Account[]),
    ])
    productos.value = productosData
    cuentas.value = cuentasData
  } finally {
    cargando.value = false
  }
})

function productoDe(id: string): Product | undefined {
  return productos.value.find(p => p.id === id)
}

function alElegirProducto(index: number) {
  const item = formState.items[index]
  if (!item) return
  const producto = productoDe(item.productId)
  if (producto) item.unitPrice = producto.price
}

function totalRenglon(item: { quantity: number; unitPrice?: number }): number {
  return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
}

const subtotal = computed(() => formState.items.reduce((total, item) => total + totalRenglon(item), 0))

const total = computed(() => Math.max(subtotal.value - (Number(formState.discount) || 0), 0))

function agregarRenglon() {
  formState.items.push({ productId: '', quantity: 1, unitPrice: undefined })
}

function quitarRenglon(index: number) {
  if (formState.items.length === 1) return
  formState.items.splice(index, 1)
}

const onSave = async (event: FormSubmitEvent<CreateSchema>) => {
  const data = event.data
  const body: CreateSale = {
    accountId: data.accountId,
    date: data.date,
    customerName: data.customerName,
    paymentMethod: data.paymentMethod,
    discount: Number(data.discount) || 0,
    notes: data.notes,
    items: data.items.map(i => ({
      productId: i.productId,
      quantity: Number(i.quantity),
      unitPrice: i.unitPrice == null ? undefined : Number(i.unitPrice),
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
                <UIcon name="i-lucide-badge-dollar-sign" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">Registrar Venta</h3>
                <p class="text-xs text-muted">
                  Descuenta stock y registra el ingreso en la cuenta
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

          <UForm v-else id="venta-form" :schema="createSchema" :state="formState" class="space-y-6" @submit="onSave">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Cuenta de ingreso" name="accountId">
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
              <UFormField label="Cliente" name="customerName">
                <UInput v-model="formState.customerName" placeholder="Mostrador" class="w-full" />
              </UFormField>
              <UFormField label="Forma de pago" name="paymentMethod">
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
                <span class="text-sm font-bold text-highlighted">Productos vendidos</span>
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
                <UFormField :label="index === 0 ? 'Producto' : undefined" :name="`items.${index}.productId`">
                  <USelectMenu
                    v-model="item.productId"
                    :items="productoItems"
                    value-key="value"
                    label-key="label"
                    placeholder="Selecciona un producto"
                    class="w-full"
                    @update:model-value="alElegirProducto(index)"
                  />
                </UFormField>
                <UFormField :label="index === 0 ? 'Cantidad' : undefined" :name="`items.${index}.quantity`">
                  <UInput v-model="item.quantity" type="number" min="0.0001" step="0.01" class="w-full" />
                </UFormField>
                <UFormField :label="index === 0 ? 'Precio unit.' : undefined" :name="`items.${index}.unitPrice`">
                  <UInput v-model="item.unitPrice" type="number" min="0" step="0.01" class="w-full" />
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
              <UFormField label="Descuento (monto)" name="discount">
                <UInput v-model="formState.discount" type="number" min="0" step="0.01" class="w-full" />
              </UFormField>
              <UFormField label="Notas" name="notes">
                <UInput v-model="formState.notes" placeholder="Venta del día" class="w-full" />
              </UFormField>
            </div>

            <div class="rounded-xl border border-default bg-elevated/60 p-4 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">Subtotal</span>
                <span class="text-highlighted">{{ formatMoney(subtotal, moneda) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">Descuento</span>
                <span class="text-highlighted">-{{ formatMoney(Number(formState.discount) || 0, moneda) }}</span>
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
          <UButton type="submit" form="venta-form" color="primary" :loading="saving" label="Registrar Venta" />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
