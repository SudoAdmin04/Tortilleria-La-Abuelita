<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, type CreateSchema } from '~/schemas/inventario.schema'
import type { AdjustInventory, LowStockItem } from '~/services/inventory.service'
import type { Supply } from '~/services/supplies.service'
import type { Product } from '~/services/products.service'
import { formatMoney } from '~/utils/format'
import { toISODate } from '~/utils/date-range'

const open = defineModel<boolean>('open', { default: false })
const props = withDefaults(defineProps<{
  initial?: LowStockItem | null
  currency?: string
}>(), {
  initial: null,
  currency: 'MXN',
})

const emit = defineEmits<{ refresh: [] }>()

const { adjust, saving } = useInventario()
const { fetchAll: fetchInsumos } = useInsumos()
const { fetchAll: fetchProductos } = useProductos()

const cargando = ref(false)
const insumos = ref<Supply[]>([])
const productos = ref<Product[]>([])

const tiposAjusteItems = [
  { value: 'adjustment_in', label: 'Ajuste de entrada (+)' },
  { value: 'adjustment_out', label: 'Ajuste de salida (−)' },
  { value: 'waste', label: 'Merma (−)' },
  { value: 'return_in', label: 'Devolución de entrada (+)' },
  { value: 'return_out', label: 'Devolución de salida (−)' },
]

const formState = reactive<CreateSchema>({
  itemType: 'supply',
  itemId: '',
  type: 'adjustment_in',
  quantity: 1,
  unitCost: undefined,
  date: toISODate(new Date()),
  notes: '',
})

const articuloItems = computed(() => formState.itemType === 'supply'
  ? insumos.value.map(s => ({ value: s.id, label: `${s.name} (${s.unit})` }))
  : productos.value.map(p => ({ value: p.id, label: `${p.name} (${p.unit})` })))

watch(open, async (isOpen) => {
  if (!isOpen) return
  Object.assign(formState, {
    itemType: props.initial?.itemType ?? 'supply',
    itemId: props.initial?.id ?? '',
    type: 'adjustment_in',
    quantity: 1,
    unitCost: undefined,
    date: toISODate(new Date()),
    notes: '',
  })
  cargando.value = true
  try {
    const [insumosData, productosData] = await Promise.all([fetchInsumos(), fetchProductos()])
    insumos.value = insumosData
    productos.value = productosData
  } finally {
    cargando.value = false
  }
})

watch(() => formState.itemType, () => {
  if (!props.initial || props.initial.itemType !== formState.itemType) formState.itemId = ''
})

const articuloActual = computed(() => {
  if (formState.itemType === 'supply') return insumos.value.find(s => s.id === formState.itemId)
  return productos.value.find(p => p.id === formState.itemId)
})

function alElegirArticulo() {
  const articulo = articuloActual.value
  if (articulo && 'averageCost' in articulo && !formState.unitCost) {
    formState.unitCost = articulo.averageCost || articulo.lastCost || 0
  }
}

const esEntrada = computed(() => ['adjustment_in', 'return_in'].includes(formState.type))

const stockResultante = computed(() => {
  const stock = articuloActual.value?.stock ?? 0
  const cantidad = Number(formState.quantity) || 0
  return esEntrada.value ? stock + cantidad : Math.max(stock - cantidad, 0)
})

const onSave = async (event: FormSubmitEvent<CreateSchema>) => {
  const data = event.data
  const body: AdjustInventory = {
    itemType: data.itemType,
    itemId: data.itemId,
    type: data.type,
    quantity: Number(data.quantity),
    unitCost: data.unitCost == null ? undefined : Number(data.unitCost),
    date: data.date,
    notes: data.notes,
  }
  const result = await adjust(body)
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
                <UIcon name="i-lucide-sliders-horizontal" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">Ajuste de Inventario</h3>
                <p class="text-xs text-muted">
                  Registra entradas, salidas o mermas sobre el stock actual
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

          <UForm v-else id="ajuste-form" :schema="createSchema" :state="formState" class="space-y-6" @submit="onSave">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Tipo de artículo" name="itemType">
                <USelectMenu
                  v-model="formState.itemType"
                  :items="[
                    { value: 'supply', label: 'Insumo' },
                    { value: 'product', label: 'Producto' },
                  ]"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Tipo de ajuste" name="type">
                <USelectMenu
                  v-model="formState.type"
                  :items="tiposAjusteItems"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Artículo" name="itemId" class="sm:col-span-2">
                <USelectMenu
                  v-model="formState.itemId"
                  :items="articuloItems"
                  value-key="value"
                  label-key="label"
                  placeholder="Selecciona un artículo"
                  icon="i-lucide-boxes"
                  class="w-full"
                  @update:model-value="alElegirArticulo"
                />
              </UFormField>
              <UFormField label="Cantidad" name="quantity">
                <UInput v-model="formState.quantity" type="number" min="0.0001" step="0.01" class="w-full" />
              </UFormField>
              <UFormField label="Costo unitario" name="unitCost">
                <UInput v-model="formState.unitCost" type="number" min="0" step="0.01" placeholder="Opcional" class="w-full" />
              </UFormField>
              <UFormField label="Fecha" name="date">
                <UInput v-model="formState.date" type="date" class="w-full" />
              </UFormField>
              <UFormField label="Motivo / notas" name="notes">
                <UInput v-model="formState.notes" placeholder="Merma por humedad" class="w-full" />
              </UFormField>
            </div>

            <div v-if="articuloActual" class="rounded-xl border border-default bg-elevated/60 p-4 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">Stock actual</span>
                <span class="text-highlighted">{{ articuloActual.stock }} {{ articuloActual.unit }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">Stock resultante</span>
                <span class="font-semibold" :class="esEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
                  {{ Number(stockResultante.toFixed(4)) }} {{ articuloActual.unit }}
                </span>
              </div>
              <div v-if="formState.unitCost != null" class="flex items-center justify-between text-sm">
                <span class="text-muted">Valor del movimiento</span>
                <span class="text-highlighted">
                  {{ formatMoney((Number(formState.quantity) || 0) * (Number(formState.unitCost) || 0), currency) }}
                </span>
              </div>
            </div>
          </UForm>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="ajuste-form" color="primary" :loading="saving" label="Registrar Ajuste" />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
