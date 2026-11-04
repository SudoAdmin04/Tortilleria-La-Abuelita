<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/proveedores.schema'
import type { Supplier, CreateSupplier, UpdateSupplier } from '~/services/suppliers.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ proveedor?: Supplier | null }>()
const emit = defineEmits<{ refresh: [] }>()

const { create, update, saving } = useProveedores()
const isEditing = computed(() => !!props.proveedor)
const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  name: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  isActive: true,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  Object.assign(formState, {
    name: props.proveedor?.name ?? '',
    contactName: props.proveedor?.contactName ?? '',
    phone: props.proveedor?.phone ?? '',
    email: props.proveedor?.email ?? '',
    address: props.proveedor?.address ?? '',
    notes: '',
    isActive: props.proveedor?.isActive ?? true,
  })
})

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const data = event.data as CreateSchema & EditSchema
  const body: CreateSupplier = {
    name: data.name,
    contactName: data.contactName,
    phone: data.phone,
    email: data.email,
    address: data.address,
    notes: data.notes,
  }
  const result = isEditing.value && props.proveedor
    ? await update(props.proveedor.id, { ...body, isActive: data.isActive } satisfies UpdateSupplier)
    : await create(body)
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
                <UIcon name="i-lucide-building-2" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ isEditing ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor' }}
                </h3>
                <p class="text-xs text-muted">
                  {{ isEditing ? 'Actualiza los datos del proveedor' : 'Registra a quién le compras insumos' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="proveedor-form" :schema="schema" :state="formState" class="space-y-6" @submit="onSave">
            <div class="grid grid-cols-1 gap-4">
              <UFormField label="Nombre o razón social" name="name">
                <UInput v-model="formState.name" placeholder="Ej. Harinas del Norte" class="w-full" />
              </UFormField>
              <UFormField label="Persona de contacto" name="contactName">
                <UInput v-model="formState.contactName" placeholder="Ej. Laura Méndez" class="w-full" />
              </UFormField>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Teléfono" name="phone">
                  <UInput v-model="formState.phone" placeholder="8181234567" class="w-full" />
                </UFormField>
                <UFormField label="Correo" name="email">
                  <UInput v-model="formState.email" type="email" placeholder="ventas@proveedor.mx" class="w-full" />
                </UFormField>
              </div>
              <UFormField label="Dirección" name="address">
                <UInput v-model="formState.address" placeholder="Calle, número, ciudad" class="w-full" />
              </UFormField>
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
            form="proveedor-form"
            color="primary"
            :loading="saving"
            :label="isEditing ? 'Guardar Cambios' : 'Registrar Proveedor'"
          />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
