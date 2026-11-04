<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, type CreateSchema } from '~/schemas/produccion.schema'
import type { CreateProduction } from '~/services/production.service'
import type { Product } from '~/services/products.service'
import { formatMoney } from '~/utils/format'
import { toISODate } from '~/utils/date-range'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ currency?: string }>()
const emit = defineEmits<{ refresh: [] }>()

const { create, saving } = useProduccion()
const { fetchAll: fetchProductos } = useProductos()

const cargando = ref(false)
const productos = ref<Product[]>([])

const moneda = computed(() => props.currency || 'MXN')

const productoItems = computed(() => productos.value
  .filter(p => p.isActive)
  .map(p => ({ value: p.id, label: p.name })))

const formState = reactive<CreateSchema>({
  productId: '',
  date: toISODate(new Date()),
  quantity: 1,
  notes: '',
})

watch(open, async (isOpen) => {
  if (!isOpen) return
  Object.assign(formState, {
    productId: '',
    date: toISODate(new Date()),
    quantity: 1,
    notes: '',
  })
  cargando.value = true
  try {
    productos.value = await fetchProductos()
  } finally {
    cargando.value = false
  }
})

const producto = computed(() => productos.value.find(p => p.id === formState.productId))

const receta = computed(() => producto.value?.recipe ?? [])

const insumosRequeridos = computed(() => {
  const cantidad = Number(formState.quantity) || 0
  return receta.value.map(item => ({
    id: item.id,
    supplyName: item.supplyName,
    supplyUnit: item.supplyUnit,
    requerido: item.quantity * cantidad,
    costo: item.lineCost * cantidad,
  }))
})

const costoEstimado = computed(() => (producto.value?.cost ?? 0) * (Number(formState.quantity) || 0))

const onSave = async (event: FormSubmitEvent<CreateSchema>) => {
  const data = event.data
  const body: CreateProduction = {
    productId: data.productId,
    date: data.date,
    quantity: Number(data.quantity),
    notes: data.notes,
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
                <UIcon name="i-lucide-factory" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">Registrar Producción</h3>
                <p class="text-xs text-muted">
                  Consume insumos según la receta y aumenta el stock del producto
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <div v-if="cargando" class="flex flex-col gap-3 animate-pulse">
            <div v-for="n in 4" :key="n" class="h-10 rounded-lg bg-elevated" />
          </div>

          <UForm v-else id="produccion-form" :schema="createSchema" :state="formState" class="space-y-6" @submit="onSave">
            <div class="grid grid-cols-1 gap-4">
              <UFormField label="Producto" name="productId">
                <USelectMenu
                  v-model="formState.productId"
                  :items="productoItems"
                  value-key="value"
                  label-key="label"
                  placeholder="Selecciona un producto"
                  icon="i-lucide-cookie"
                  class="w-full"
                />
              </UFormField>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Fecha" name="date">
                  <UInput v-model="formState.date" type="date" class="w-full" />
                </UFormField>
                <UFormField label="Cantidad a producir" name="quantity">
                  <UInput v-model="formState.quantity" type="number" min="0.0001" step="0.01" class="w-full" />
                </UFormField>
              </div>
              <UFormField label="Notas del lote" name="notes">
                <UTextarea v-model="formState.notes" :rows="2" placeholder="Lote matutino" class="w-full" />
              </UFormField>
            </div>

            <div v-if="producto" class="space-y-3">
              <span class="text-sm font-bold text-highlighted">Insumos requeridos</span>
              <div v-if="!insumosRequeridos.length" class="rounded-xl border border-dashed border-default p-4 text-center">
                <p class="text-sm text-muted">Este producto no tiene receta registrada.</p>
              </div>
              <div v-else class="rounded-xl border border-default overflow-hidden">
                <table class="w-full text-sm">
                  <thead class="bg-elevated/60 text-muted text-xs uppercase tracking-wider">
                    <tr>
                      <th class="text-left font-semibold px-3 py-2">Insumo</th>
                      <th class="text-right font-semibold px-3 py-2">Requerido</th>
                      <th class="text-right font-semibold px-3 py-2">Costo</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-default">
                    <tr v-for="item in insumosRequeridos" :key="item.id">
                      <td class="px-3 py-2.5 text-highlighted">{{ item.supplyName }}</td>
                      <td class="px-3 py-2.5 text-right text-toned whitespace-nowrap">
                        {{ Number(item.requerido.toFixed(4)) }} {{ item.supplyUnit }}
                      </td>
                      <td class="px-3 py-2.5 text-right text-toned whitespace-nowrap">{{ formatMoney(item.costo, moneda) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="flex items-center justify-between rounded-xl border border-default bg-elevated/60 px-4 py-3">
                <span class="text-xs uppercase tracking-widest text-muted">Costo estimado del lote</span>
                <span class="text-base font-bold text-highlighted">{{ formatMoney(costoEstimado, moneda) }}</span>
              </div>
            </div>
          </UForm>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="produccion-form" color="primary" :loading="saving" label="Registrar Producción" />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
