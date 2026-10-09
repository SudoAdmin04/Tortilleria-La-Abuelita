<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/roles.schema'
import type { Role, CreateRole, UpdateRole } from '~/services/roles.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  rol?: Role | null
}>()
const emit = defineEmits(['refresh'])

const { create, update } = useRoles()
const isEditing = computed(() => !!props.rol)

const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  name: '',
  description: '',
  isAdmin: false,
  isActive: true,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.rol) {
    Object.assign(formState, {
      name: props.rol.name,
      description: props.rol.description || '',
      isAdmin: props.rol.isAdmin,
      isActive: props.rol.isActive,
    })
  } else {
    Object.assign(formState, {
      name: '',
      description: '',
      isAdmin: false,
      isActive: true,
    })
  }
})

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const payload = event.data
  if (isEditing.value && props.rol) {
    const body: UpdateRole = {
      name: (payload as EditSchema).name,
      description: (payload as EditSchema).description || undefined,
      isAdmin: (payload as EditSchema).isAdmin,
      isActive: (payload as EditSchema).isActive,
    }
    const r = await update(props.rol.id, body)
    if (!r) return
  } else {
    const body: CreateRole = {
      name: (payload as CreateSchema).name,
      description: (payload as CreateSchema).description || undefined,
      isAdmin: (payload as CreateSchema).isAdmin ?? false,
      isActive: (payload as CreateSchema).isActive ?? true,
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
                <UIcon name="i-lucide-shield-check" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  {{ isEditing ? 'Editar Rol' : 'Registrar Nuevo Rol' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ isEditing ? 'Actualiza los datos del rol' : 'Registra un nuevo rol en el sistema' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="rol-form" :schema="schema" :state="formState" class="space-y-8" @submit="onSave">

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Datos del Rol
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Nombre" name="name">
                  <UInput v-model="formState.name" placeholder="Ej. Administrador" class="w-full" />
                </UFormField>
                <UFormField label="Descripción" name="description">
                  <UInput v-model="formState.description" placeholder="Rol con acceso total al sistema" class="w-full" />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Es admin" name="isAdmin">
                    <USwitch v-model="formState.isAdmin" />
                  </UFormField>
                  <UFormField label="Activo" name="isActive">
                    <USwitch v-model="formState.isActive" />
                  </UFormField>
                </div>
              </div>
            </div>

          </UForm>
        </div>

        <div class="bg-white/[0.02] flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-neutral-700">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="rol-form" color="primary" variant="solid" :label="isEditing ? 'Guardar Cambios' : 'Registrar Rol'" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
