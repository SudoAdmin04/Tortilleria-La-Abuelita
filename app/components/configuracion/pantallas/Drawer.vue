<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type {
  CreatePantallaDto,
  Pantalla,
  UpdatePantallaDto,
} from '~/services/pantallas.repository'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  pantalla?: Pantalla | null
}>()

const emit = defineEmits<{
  save: [data: CreatePantallaDto | UpdatePantallaDto]
}>()

const submitting = ref(false)
const isEditing = computed(() => !!props.pantalla)

/**
 * Refleja `CreatePantallaDto` / `UpdatePantallaDto` del swagger:
 * nombre/ruta/icono/orden obligatorios, padreId/subMenu opcionales.
 * Los vacíos (`''`) se normalizan a `undefined` para no enviar
 * strings vacíos al backend.
 */
const emptyToUndefined = (val: unknown) => (val === '' || val === null ? undefined : val)

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  ruta: z.string().min(1, 'La ruta es obligatoria'),
  icono: z.string().min(1, 'El icono es obligatorio'),
  orden: z.coerce.number().min(0, 'Debe ser un número válido'),
  padreId: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  subMenu: z.preprocess(emptyToUndefined, z.string().optional()),
})

type Schema = z.output<typeof schema>

const formState = reactive<Schema>({
  nombre: '',
  ruta: '',
  icono: '',
  orden: 0,
  padreId: undefined,
  subMenu: undefined,
})

function resetForm() {
  Object.assign(formState, {
    nombre: '',
    ruta: '',
    icono: '',
    orden: 0,
    padreId: undefined,
    subMenu: undefined,
  })
}

watch(() => open.value, (isOpen) => {
  if (!isOpen) return
  if (props.pantalla) {
    // La respuesta trae el padre anidado (`padre: { id, ... }`), no `padreId` plano.
    Object.assign(formState, {
      nombre: props.pantalla.nombre,
      ruta: props.pantalla.ruta,
      icono: props.pantalla.icono,
      orden: props.pantalla.orden,
      padreId: props.pantalla.padre?.id ?? undefined,
      subMenu: props.pantalla.subMenu || undefined,
    })
  } else {
    resetForm()
  }
})

async function onSave(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  try {
    if (isEditing.value) {
      emit('save', event.data as UpdatePantallaDto)
    } else {
      emit('save', event.data as CreatePantallaDto)
    }
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
                <UIcon name="i-heroicons-computer-desktop" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  {{ isEditing ? `Editar Pantalla: ${pantalla?.nombre}` : 'Nueva Pantalla' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ isEditing ? 'Actualiza los datos de la pantalla' : 'Registra una nueva pantalla en el catálogo' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="rounded-full shrink-0" @click="() => {open = false}" />
          </div>
          <USeparator />
        </div>

        <div class="flex-1 overflow-y-auto px-6 space-y-6">
          <UForm id="pantalla-form" :schema="schema" :state="formState" class="space-y-5 pb-4" @submit="onSave">

            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-primary">1. Información General</h4>

              <UFormField label="Nombre de la Pantalla *" name="nombre">
                <UInput v-model="formState.nombre" placeholder="Ej. Dashboard" class="w-full" />
              </UFormField>

              <UFormField label="Ruta *" name="ruta">
                <UInput v-model="formState.ruta" placeholder="Ej. /dashboard" class="w-full" />
              </UFormField>

              <UFormField label="Icono *" name="icono">
                <UInput v-model="formState.icono" placeholder="Ej. i-heroicons-chart-bar-square" class="w-full" />
              </UFormField>
            </div>

            <USeparator />

            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-primary">2. Configuración</h4>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Orden *" name="orden">
                  <UInput v-model="formState.orden" type="number" min="0" placeholder="Ej. 3" class="w-full" />
                </UFormField>
                <UFormField label="Pantalla Padre" name="padreId">
                  <UInput v-model="formState.padreId" type="number" min="0" placeholder="Ej. 1" class="w-full" />
                </UFormField>
              </div>

              <UFormField label="Sub Menú" name="subMenu">
                <UInput v-model="formState.subMenu" placeholder="Nombre del sub menú" class="w-full" />
              </UFormField>
            </div>

          </UForm>
        </div>

        <div class="p-6 pt-4 shrink-0 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-end gap-3">
          <UButton color="neutral" variant="outline" size="sm" @click="() => {open = false}">Cancelar</UButton>
          <UButton type="submit" form="pantalla-form" color="primary" size="sm" :loading="submitting">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Pantalla' }}
          </UButton>
        </div>

      </div>
    </template>
  </UDrawer>
</template>
