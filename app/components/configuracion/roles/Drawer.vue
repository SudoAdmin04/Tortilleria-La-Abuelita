<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { components } from '~/types/api'

type Rol = components['schemas']['Rol']

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  rol?: Rol | null
}>()

const emit = defineEmits<{
  save: [data: { descripcion: string }]
}>()

const submitting = ref(false)
const isEditing = computed(() => !!props.rol)

const schema = z.object({
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
})

type Schema = z.output<typeof schema>

const formState = reactive<Schema>({
  descripcion: '',
})

watch(() => open.value, (isOpen) => {
  if (isOpen && props.rol) {
    formState.descripcion = props.rol.descripcion
  } else if (isOpen) {
    formState.descripcion = ''
  }
})

async function onSave(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  try {
    emit('save', event.data)
    open.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDrawer v-model:open="open" direction="right" :dismissible="false" :handle="false">
    <template #content>
      <div class="flex flex-col h-full w-full min-w-200">

        <div class="p-6 pb-4 flex flex-col gap-4 shrink-0">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-500 shrink-0">
                <UIcon name="i-heroicons-lock-closed" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  {{ isEditing ? `Editar Rol: ${rol?.descripcion}` : 'Nuevo Rol del Sistema' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ isEditing ? 'Actualiza la descripción del rol' : 'Crea un nuevo nivel de acceso para los usuarios' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="rounded-full shrink-0" @click="() => {open = false}" />
          </div>
          <USeparator />
        </div>

        <div class="flex-1 overflow-y-auto px-6 space-y-6">
          <UForm id="rol-form" :schema="schema" :state="formState" class="space-y-5 pb-4" @submit="onSave">

            <div class="space-y-3">
              <h4 class="text-base font-semibold leading-7 flex items-center gap-2">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Definición General
              </h4>

              <UFormField label="Descripción del Rol *" name="descripcion">
                <UInput v-model="formState.descripcion" placeholder="Ej. Administrador" class="w-full" />
              </UFormField>
            </div>

          </UForm>
        </div>

        <div class="p-6 pt-4 shrink-0 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-end gap-3">
          <UButton color="neutral" variant="outline" size="sm" @click="() => {open = false}">Cancelar</UButton>
          <UButton type="submit" form="rol-form" color="primary" size="sm" :loading="submitting">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Rol' }}
          </UButton>
        </div>

      </div>
    </template>
  </UDrawer>
</template>
