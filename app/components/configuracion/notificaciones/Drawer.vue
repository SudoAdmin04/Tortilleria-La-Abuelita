<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, type CreateSchema } from '~/schemas/notificaciones.schema'
import type { CreateNotification } from '~/services/notifications.service'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits(['refresh'])

const { create } = useNotificaciones()

const formState = reactive({
  title: '',
  body: '',
  type: 'info' as 'info' | 'warning' | 'success' | 'error',
  isRead: false,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  Object.assign(formState, { title: '', body: '', type: 'info', isRead: false })
})

const typeItems = [
  { value: 'info', label: 'Informativa' },
  { value: 'warning', label: 'Advertencia' },
  { value: 'success', label: 'Éxito' },
  { value: 'error', label: 'Error' },
]

const onSave = async (event: FormSubmitEvent<CreateSchema>) => {
  const payload = event.data
  const body: CreateNotification = {
    title: payload.title,
    body: payload.body,
    type: payload.type ?? 'info',
    isRead: payload.isRead ?? false,
  }
  const r = await create(body)
  if (!r) return
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
                <UIcon name="i-lucide-bell" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  Registrar Nueva Notificación
                </h3>
                <p class="text-xs text-muted">
                  Crea una notificación para el usuario
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="notificacion-form" :schema="createSchema" :state="formState" class="space-y-8" @submit="onSave">

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Datos de la Notificación
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Título" name="title">
                  <UInput v-model="formState.title" placeholder="Ej. Presupuesto excedido" class="w-full" />
                </UFormField>
                <UFormField label="Mensaje" name="body">
                  <UTextarea v-model="formState.body" placeholder="Has superado el 80% de tu presupuesto..." class="w-full" />
                </UFormField>
                <UFormField label="Tipo" name="type">
                  <USelectMenu
                    v-model="formState.type"
                    :items="typeItems"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

          </UForm>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="notificacion-form" color="primary" variant="solid" label="Registrar Notificación" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
