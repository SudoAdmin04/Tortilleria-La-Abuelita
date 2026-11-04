<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/insumos.schema'
import { SUPPLY_UNITS, type Supply, type CreateSupply, type UpdateSupply } from '~/services/supplies.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ insumo?: Supply | null }>()
const emit = defineEmits<{ refresh: [] }>()

const { create, update, saving } = useInsumos()
const isEditing = computed(() => !!props.insumo)
const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  name: '',
  sku: '',
  unit: 'kg' as CreateSchema['unit'],
  minStock: 0,
  initialStock: undefined as number | undefined,
  initialCost: undefined as number | undefined,
  notes: '',
  isActive: true,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  Object.assign(formState, {
    name: props.insumo?.name ?? '',
    sku: props.insumo?.sku ?? '',
    unit: props.insumo?.unit ?? 'kg',
    minStock: props.insumo?.minStock ?? 0,
    initialStock: undefined,
    initialCost: undefined,
    notes: '',
    isActive: props.insumo?.isActive ?? true,
  })
})

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const data = event.data as CreateSchema & EditSchema
  if (isEditing.value && props.insumo) {
    const body: UpdateSupply = {
      name: data.name,
      sku: data.sku,
      unit: data.unit,
      minStock: data.minStock,
      notes: data.notes,
      isActive: data.isActive,
    }
    const result = await update(props.insumo.id, body)
    if (!result) return
  } else {
    const body: CreateSupply = {
      name: data.name,
      sku: data.sku,
      unit: data.unit,
      minStock: data.minStock,
      initialStock: data.initialStock,
      initialCost: data.initialCost,
      notes: data.notes,
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
                <UIcon name="i-lucide-wheat" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ isEditing ? 'Editar Insumo' : 'Registrar Nuevo Insumo' }}
                </h3>
                <p class="text-xs text-muted">
                  {{ isEditing ? 'Actualiza los datos del insumo' : 'Materia prima que se compra y consume' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="insumo-form" :schema="schema" :state="formState" class="space-y-6" @submit="onSave">
            <div class="grid grid-cols-1 gap-4">
              <UFormField label="Nombre" name="name">
                <UInput v-model="formState.name" placeholder="Ej. Harina de maíz nixtamalizado" class="w-full" />
              </UFormField>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="SKU" name="sku">
                  <UInput v-model="formState.sku" placeholder="HAR-MAIZ" class="w-full" />
                </UFormField>
                <UFormField label="Unidad" name="unit">
                  <USelectMenu
                    v-model="formState.unit"
                    :items="SUPPLY_UNITS"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>
              </div>
              <UFormField label="Stock mínimo" name="minStock">
                <UInput v-model="formState.minStock" type="number" min="0" step="0.01" class="w-full" />
              </UFormField>

              <template v-if="!isEditing">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UFormField label="Stock inicial" name="initialStock">
                    <UInput v-model="formState.initialStock" type="number" min="0" step="0.01" placeholder="Opcional" class="w-full" />
                  </UFormField>
                  <UFormField label="Costo inicial" name="initialCost">
                    <UInput v-model="formState.initialCost" type="number" min="0" step="0.01" placeholder="Opcional" class="w-full" />
                  </UFormField>
                </div>
              </template>

              <UFormField label="Notas" name="notes">
                <UTextarea v-model="formState.notes" :rows="3" placeholder="Notas internas" class="w-full" />
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
            form="insumo-form"
            color="primary"
            :loading="saving"
            :label="isEditing ? 'Guardar Cambios' : 'Registrar Insumo'"
          />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
