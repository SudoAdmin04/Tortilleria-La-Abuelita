<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/productos.schema'
import { PRODUCT_UNITS, type Product, type CreateProduct, type UpdateProduct } from '~/services/products.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ producto?: Product | null }>()
const emit = defineEmits<{ refresh: [] }>()

const { create, update, saving } = useProductos()
const isEditing = computed(() => !!props.producto)
const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  name: '',
  sku: '',
  unit: 'kg' as CreateSchema['unit'],
  price: 0,
  minStock: 0,
  initialStock: undefined as number | undefined,
  cost: undefined as number | undefined,
  description: '',
  isActive: true,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  Object.assign(formState, {
    name: props.producto?.name ?? '',
    sku: props.producto?.sku ?? '',
    unit: props.producto?.unit ?? 'kg',
    price: props.producto?.price ?? 0,
    minStock: props.producto?.minStock ?? 0,
    initialStock: undefined,
    cost: undefined,
    description: '',
    isActive: props.producto?.isActive ?? true,
  })
})

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const data = event.data as CreateSchema & EditSchema
  if (isEditing.value && props.producto) {
    const body: UpdateProduct = {
      name: data.name,
      sku: data.sku,
      unit: data.unit,
      price: data.price,
      minStock: data.minStock,
      description: data.description,
      isActive: data.isActive,
    }
    const result = await update(props.producto.id, body)
    if (!result) return
  } else {
    const body: CreateProduct = {
      name: data.name,
      sku: data.sku,
      unit: data.unit,
      price: data.price,
      minStock: data.minStock,
      initialStock: data.initialStock,
      cost: data.cost,
      description: data.description,
    }
    const result = await create(body)
    if (!result) return
  }
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
                <UIcon name="i-lucide-cookie" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ isEditing ? 'Editar Producto' : 'Registrar Nuevo Producto' }}
                </h3>
                <p class="text-xs text-muted">
                  {{ isEditing ? 'Actualiza los datos del producto' : 'Producto terminado que se vende al cliente' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="producto-form" :schema="schema" :state="formState" class="space-y-6" @submit="onSave">
            <div class="grid grid-cols-1 gap-4">
              <UFormField label="Nombre" name="name">
                <UInput v-model="formState.name" placeholder="Ej. Tortilla de maíz por kilo" class="w-full" />
              </UFormField>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="SKU" name="sku">
                  <UInput v-model="formState.sku" placeholder="TOR-KG" class="w-full" />
                </UFormField>
                <UFormField label="Unidad de venta" name="unit">
                  <USelectMenu
                    v-model="formState.unit"
                    :items="PRODUCT_UNITS"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Precio de venta" name="price">
                  <UInput v-model="formState.price" type="number" min="0.01" step="0.01" class="w-full" />
                </UFormField>
                <UFormField label="Stock mínimo" name="minStock">
                  <UInput v-model="formState.minStock" type="number" min="0" step="0.01" class="w-full" />
                </UFormField>
              </div>

              <template v-if="!isEditing">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UFormField label="Stock inicial" name="initialStock">
                    <UInput v-model="formState.initialStock" type="number" min="0" step="0.01" placeholder="Opcional" class="w-full" />
                  </UFormField>
                  <UFormField label="Costo unitario" name="cost">
                    <UInput v-model="formState.cost" type="number" min="0" step="0.01" placeholder="Si no usas receta" class="w-full" />
                  </UFormField>
                </div>
              </template>

              <UFormField label="Descripción" name="description">
                <UTextarea v-model="formState.description" :rows="3" placeholder="Descripción del producto" class="w-full" />
              </UFormField>
              <UFormField v-if="isEditing" label="Activo" name="isActive">
                <USwitch v-model="formState.isActive" />
              </UFormField>
            </div>
          </UForm>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton
            type="submit"
            form="producto-form"
            color="primary"
            :loading="saving"
            :label="isEditing ? 'Guardar Cambios' : 'Registrar Producto'"
          />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
