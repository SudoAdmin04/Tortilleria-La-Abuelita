<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/permisos.schema'
import type { RoleScreen, CreateRoleScreen, UpdateRoleScreen } from '~/services/role-screens.service'
import type { Role } from '~/services/roles.service'
import type { Screen } from '~/services/screens.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  permiso?: RoleScreen | null
  roles?: Role[]
  pantallas?: Screen[]
}>()
const emit = defineEmits(['refresh'])

const { create, update } = useRolePermissions()
const isEditing = computed(() => !!props.permiso)

const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  roleId: 0 as number,
  screenId: 0 as number,
  canRead: true,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.permiso) {
    Object.assign(formState, {
      roleId: props.permiso.roleId,
      screenId: props.permiso.screenId,
      canRead: props.permiso.canRead,
      canCreate: props.permiso.canCreate,
      canUpdate: props.permiso.canUpdate,
      canDelete: props.permiso.canDelete,
    })
  } else {
    Object.assign(formState, {
      roleId: props.roles?.[0]?.id ?? 0,
      screenId: props.pantallas?.[0]?.id ?? 0,
      canRead: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    })
  }
})

const roleItems = computed(() => (props.roles ?? []).map(r => ({ value: r.id, label: r.name })))
const screenItems = computed(() => (props.pantallas ?? []).map(s => ({ value: s.id, label: s.name })))

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const payload = event.data
  if (isEditing.value && props.permiso) {
    const body: UpdateRoleScreen = {
      roleId: (payload as EditSchema).roleId ?? formState.roleId,
      screenId: (payload as EditSchema).screenId ?? formState.screenId,
      canRead: (payload as EditSchema).canRead,
      canCreate: (payload as EditSchema).canCreate,
      canUpdate: (payload as EditSchema).canUpdate,
      canDelete: (payload as EditSchema).canDelete,
    }
    const r = await update(props.permiso.id, body)
    if (!r) return
  } else {
    const body: CreateRoleScreen = {
      roleId: Number((payload as CreateSchema).roleId),
      screenId: Number((payload as CreateSchema).screenId),
      canRead: (payload as CreateSchema).canRead ?? false,
      canCreate: (payload as CreateSchema).canCreate ?? false,
      canUpdate: (payload as CreateSchema).canUpdate ?? false,
      canDelete: (payload as CreateSchema).canDelete ?? false,
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
                <UIcon name="i-heroicons-key" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  {{ isEditing ? 'Editar Permiso' : 'Asignar Nuevo Permiso' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ isEditing ? 'Actualiza el acceso rol × pantalla' : 'Asigna una pantalla a un rol con sus accesos' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="permiso-form" :schema="schema" :state="formState" class="space-y-8" @submit="onSave">

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Rol × Pantalla
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Rol" name="roleId">
                  <USelectMenu
                    v-model="formState.roleId"
                    :items="roleItems"
                    value-key="value"
                    label-key="label"
                    placeholder="Selecciona un rol"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Pantalla" name="screenId">
                  <USelectMenu
                    v-model="formState.screenId"
                    :items="screenItems"
                    value-key="value"
                    label-key="label"
                    placeholder="Selecciona una pantalla"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

            <USeparator />

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">2</span>
                Accesos
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Leer" name="canRead">
                  <USwitch v-model="formState.canRead" />
                </UFormField>
                <UFormField label="Crear" name="canCreate">
                  <USwitch v-model="formState.canCreate" />
                </UFormField>
                <UFormField label="Editar" name="canUpdate">
                  <USwitch v-model="formState.canUpdate" />
                </UFormField>
                <UFormField label="Eliminar" name="canDelete">
                  <USwitch v-model="formState.canDelete" />
                </UFormField>
              </div>
            </div>

          </UForm>
        </div>

        <div class="bg-white/[0.02] flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-neutral-700">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="permiso-form" color="primary" variant="solid" :label="isEditing ? 'Guardar Cambios' : 'Asignar Permiso'" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
