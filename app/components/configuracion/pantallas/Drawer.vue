<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/pantallas.schema'
import type { Screen, CreateScreen, UpdateScreen } from '~/services/screens.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  pantalla?: Screen | null
  pantallas?: Screen[]
}>()
const emit = defineEmits(['refresh'])

const { create, update } = usePantallas()
const isEditing = computed(() => !!props.pantalla)

const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  name: '',
  path: '',
  icon: '',
  order: 0 as number | undefined,
  parentId: undefined as number | undefined,
  module: 'finanzas',
  isActive: true,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.pantalla) {
    Object.assign(formState, {
      name: props.pantalla.name,
      path: props.pantalla.path || '',
      icon: props.pantalla.icon || '',
      order: props.pantalla.order ?? 0,
      parentId: props.pantalla.parentId ?? undefined,
      module: props.pantalla.module || 'finanzas',
      isActive: props.pantalla.isActive,
    })
  } else {
    Object.assign(formState, {
      name: '',
      path: '',
      icon: '',
      order: 0,
      parentId: undefined,
      module: 'finanzas',
      isActive: true,
    })
  }
})

const parentItems = computed(() => [
  { value: undefined as unknown as number, label: '— Sin padre (raíz) —' },
  ...((props.pantallas ?? [])
    .filter(p => !props.pantalla || p.id !== props.pantalla.id)
    .map(p => ({ value: p.id, label: p.name }))),
])

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const payload = event.data
  if (isEditing.value && props.pantalla) {
    const body: UpdateScreen = {
      name: (payload as EditSchema).name,
      path: (payload as EditSchema).path || undefined,
      icon: (payload as EditSchema).icon || undefined,
      order: (payload as EditSchema).order ?? undefined,
      parentId: (payload as EditSchema).parentId ?? undefined,
      module: (payload as EditSchema).module || undefined,
      isActive: (payload as EditSchema).isActive,
    }
    const r = await update(props.pantalla.id, body)
    if (!r) return
  } else {
    const body: CreateScreen = {
      name: (payload as CreateSchema).name,
      path: (payload as CreateSchema).path || undefined,
      icon: (payload as CreateSchema).icon || undefined,
      order: (payload as CreateSchema).order ?? undefined,
      parentId: (payload as CreateSchema).parentId ?? undefined,
      module: (payload as CreateSchema).module || undefined,
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
                <UIcon name="i-heroicons-computer-desktop" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  {{ isEditing ? 'Editar Pantalla' : 'Registrar Nueva Pantalla' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ isEditing ? 'Actualiza los datos de la pantalla' : 'Registra una nueva pantalla en el catálogo' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="pantalla-form" :schema="schema" :state="formState" class="space-y-8" @submit="onSave">

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Datos de la Pantalla
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Nombre" name="name">
                  <UInput v-model="formState.name" placeholder="Ej. Dashboard" class="w-full" />
                </UFormField>
                <UFormField label="Ruta" name="path">
                  <UInput v-model="formState.path" placeholder="/dashboard" class="w-full" />
                </UFormField>
                <UFormField label="Icono" name="icon">
                  <UInput v-model="formState.icon" placeholder="i-lucide-layout-dashboard" class="w-full" />
                </UFormField>
              </div>
            </div>

            <USeparator />

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">2</span>
                Jerarquía y Módulo
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Orden" name="order">
                    <UInput v-model="formState.order" type="number" min="0" class="w-full" />
                  </UFormField>
                  <UFormField label="Módulo" name="module">
                    <UInput v-model="formState.module" placeholder="finanzas|sistema|catalogos" class="w-full" />
                  </UFormField>
                </div>
                <UFormField label="Pantalla padre" name="parentId">
                  <USelectMenu
                    v-model="formState.parentId"
                    :items="parentItems"
                    value-key="value"
                    label-key="label"
                    placeholder="— Sin padre (raíz) —"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Activa" name="isActive">
                  <USwitch v-model="formState.isActive" />
                </UFormField>
              </div>
            </div>

          </UForm>
        </div>

        <div class="bg-white/[0.02] flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-neutral-700">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="pantalla-form" color="primary" variant="solid" :label="isEditing ? 'Guardar Cambios' : 'Registrar Pantalla'" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
