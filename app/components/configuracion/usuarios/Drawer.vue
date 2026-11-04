<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/usuarios.schema'
import type { User, CreateUser, UpdateUser } from '~/services/users.service'
import type { Role } from '~/services/roles.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  usuario?: User | null
  roles?: Role[] | null
}>()
const emit = defineEmits(['refresh'])

const { create, update } = useUsuarios()
const isEditing = computed(() => !!props.usuario)

const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  name: '',
  email: '',
  password: '',
  currency: 'MXN',
  timezone: 'America/Monterrey',
  roleId: null as number | null,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.usuario) {
    Object.assign(formState, {
      name: props.usuario.name,
      email: props.usuario.email,
      password: '',
      currency: props.usuario.currency,
      timezone: props.usuario.timezone,
      roleId: props.usuario.roleId,
    })
  } else {
    Object.assign(formState, {
      name: '',
      email: '',
      password: '',
      currency: 'MXN',
      timezone: 'America/Monterrey',
      roleId: null,
    })
  }
})

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const payload = event.data
  if (isEditing.value && props.usuario) {
    const body: UpdateUser = {
      name: payload.name,
      email: payload.email,
      currency: payload.currency,
      timezone: payload.timezone,
      roleId: payload.roleId ?? null,
      ...(payload.password ? { password: payload.password } : {}),
    }
    const r = await update(props.usuario.id, body)
    if (!r) return
  } else {
    const body: CreateUser = {
      name: payload.name,
      email: payload.email,
      password: payload.password as string,
      currency: payload.currency,
      timezone: payload.timezone,
      ...(payload.roleId ? { roleId: payload.roleId } : {}),
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

        <div class="bg-elevated/60 p-6 pb-4 flex flex-col gap-4 shrink-0 border-b border-default">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary shrink-0">
                <UIcon name="i-lucide-user" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario' }}
                </h3>
                <p class="text-xs text-muted">
                  {{ isEditing ? 'Actualiza los datos del usuario' : 'Registra un nuevo usuario en el sistema' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>


        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="usuario-form" :schema="schema" :state="formState" class="space-y-8" @submit="onSave">

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Datos de la Cuenta
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Nombre" name="name">
                  <UInput v-model="formState.name" placeholder="Ej. Alan" class="w-full" />
                </UFormField>
                <UFormField label="Correo Electrónico" name="email">
                  <UInput v-model="formState.email" type="email" placeholder="alan@example.com" class="w-full" />
                </UFormField>
                <UFormField label="Contraseña" name="password">
                  <UInput v-model="formState.password" type="password" :placeholder="isEditing ? '•••••••• (dejar vacío para no cambiar)' : '••••••••'" class="w-full" />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Moneda" name="currency">
                    <UInput v-model="formState.currency" placeholder="MXN" class="w-full" />
                  </UFormField>
                  <UFormField label="Zona horaria" name="timezone">
                    <UInput v-model="formState.timezone" placeholder="America/Monterrey" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </div>

            <USeparator />

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">2</span>
                Rol
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Rol Asignado" name="roleId">
                  <USelectMenu
                    v-model="formState.roleId"
                    :items="roles ?? []"
                    value-key="id"
                    label-key="name"
                    placeholder="Sin rol"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

          </UForm>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="usuario-form" color="primary" variant="solid" :label="isEditing ? 'Guardar Cambios' : 'Registrar Usuario'" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
