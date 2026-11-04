<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { recipeSchema, type RecipeSchema } from '~/schemas/productos.schema'
import type { Product, RecipeItem } from '~/services/products.service'
import type { Supply } from '~/services/supplies.service'
import { formatMoney } from '~/utils/format'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ producto?: Product | null, currency?: string }>()
const emit = defineEmits<{ refresh: [] }>()

const { fetchRecipe, saveRecipe, saving } = useProductos()
const { fetchAll: fetchInsumos } = useInsumos()

const cargando = ref(false)
const insumos = ref<Supply[]>([])
const formState = reactive<{ items: { supplyId: string; quantity: number }[] }>({ items: [] })

const moneda = computed(() => props.currency || 'MXN')

const insumoItems = computed(() => insumos.value.map(s => ({
  value: s.id,
  label: `${s.name} (${s.unit})`,
})))

function insumoDe(id: string): Supply | undefined {
  return insumos.value.find(s => s.id === id)
}

const costoTotal = computed(() => formState.items.reduce((total, item) => {
  const insumo = insumoDe(item.supplyId)
  if (!insumo) return total
  return total + (insumo.averageCost * (Number(item.quantity) || 0))
}, 0))

watch(open, async (isOpen) => {
  if (!isOpen || !props.producto) return
  cargando.value = true
  try {
    const [receta, catalogo] = await Promise.all([
      fetchRecipe(props.producto.id),
      fetchInsumos(),
    ])
    insumos.value = catalogo
    formState.items = receta.map(r => ({ supplyId: r.supplyId, quantity: r.quantity }))
  } finally {
    cargando.value = false
  }
})

function agregarInsumo() {
  formState.items.push({ supplyId: '', quantity: 1 })
}

function quitarInsumo(index: number) {
  formState.items.splice(index, 1)
}

const onSave = async (event: FormSubmitEvent<RecipeSchema>) => {
  if (!props.producto) return
  const items: RecipeItem[] = event.data.items.map(i => ({
    supplyId: i.supplyId,
    quantity: Number(i.quantity),
  }))
  const result = await saveRecipe(props.producto.id, items)
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
                <UIcon name="i-lucide-chef-hat" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">Receta del Producto</h3>
                <p class="text-xs text-muted">
                  {{ producto?.name ?? 'Producto' }} · insumos por unidad producida
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <div v-if="cargando" class="flex flex-col gap-3 animate-pulse">
            <div v-for="n in 3" :key="n" class="h-10 rounded-lg bg-elevated" />
          </div>

          <UForm v-else id="receta-form" :schema="recipeSchema" :state="formState" class="space-y-4" @submit="onSave">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm font-bold text-highlighted">Insumos consumidos</span>
              <UButton type="button" color="neutral" variant="outline" size="xs" icon="i-lucide-plus" label="Agregar" @click="agregarInsumo" />
            </div>

            <div v-if="!formState.items.length" class="rounded-xl border border-dashed border-default p-6 text-center">
              <p class="text-sm text-muted">Este producto no tiene receta. Agrega al menos un insumo.</p>
            </div>

            <div v-for="(item, index) in formState.items" :key="index" class="flex items-end gap-2">
              <UFormField :label="index === 0 ? 'Insumo' : undefined" :name="`items.${index}.supplyId`" class="flex-1">
                <USelectMenu
                  v-model="item.supplyId"
                  :items="insumoItems"
                  value-key="value"
                  label-key="label"
                  placeholder="Selecciona un insumo"
                  class="w-full"
                />
              </UFormField>
              <UFormField :label="index === 0 ? 'Cantidad' : undefined" :name="`items.${index}.quantity`" class="w-28">
                <UInput v-model="item.quantity" type="number" min="0.0001" step="0.0001" class="w-full" />
              </UFormField>
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                icon="i-lucide-trash-2"
                class="mb-0.5 text-muted hover:text-red-600 dark:hover:text-red-400"
                aria-label="Quitar insumo"
                @click="quitarInsumo(index)"
              />
            </div>

            <div class="flex items-center justify-between rounded-xl border border-default bg-elevated/60 px-4 py-3">
              <span class="text-xs uppercase tracking-widest text-muted">Costo estimado</span>
              <span class="text-base font-bold text-highlighted">{{ formatMoney(costoTotal, moneda) }}</span>
            </div>
          </UForm>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="receta-form" color="primary" :loading="saving" label="Guardar Receta" />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
