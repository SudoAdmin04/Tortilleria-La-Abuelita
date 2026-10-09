<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/categorias.schema'
import type { CreateCategory, UpdateCategory } from '~/services/categories.service'
import type { CategoriaRow } from '~/composables/useCategorias'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  categoria?: CategoriaRow | null
  rubros?: { id: string; name: string }[]
}>()
const emit = defineEmits(['refresh'])

const { create, update } = useCategorias()
const isEditing = computed(() => !!props.categoria)

const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  name: '',
  kind: 'expense' as 'income' | 'expense' | 'savings' | 'debt',
  parentId: undefined as string | undefined,
  color: '#3b82f6',
  icon: '',
  isActive: true,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.categoria) {
    Object.assign(formState, {
      name: props.categoria.displayName.replace(/^/, ''),
      kind: props.categoria.kind,
      parentId: props.categoria.parentId || undefined,
      color: props.categoria.color || '#3b82f6',
      icon: props.categoria.icon || '',
      isActive: props.categoria.isActive,
    })
  } else {
    Object.assign(formState, {
      name: '',
      kind: 'expense',
      parentId: undefined,
      color: '#3b82f6',
      icon: '',
      isActive: true,
    })
  }
})

const kindItems = [
  { value: 'income', label: 'Ingreso' },
  { value: 'expense', label: 'Gasto' },
  { value: 'savings', label: 'Ahorro' },
  { value: 'debt', label: 'Deuda' },
]

const rubroItems = computed(() => [
  { value: undefined as unknown as string, label: '— Es rubro (sin padre) —' },
  ...((props.rubros ?? []).map(r => ({ value: r.id, label: r.name }))),
])

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const payload = event.data
  if (isEditing.value && props.categoria) {
    const body: UpdateCategory = {
      name: (payload as EditSchema).name,
      color: (payload as EditSchema).color || undefined,
      icon: (payload as EditSchema).icon || undefined,
      sortOrder: 0,
      isActive: (payload as EditSchema).isActive,
    }
    const r = await update(props.categoria.id, body)
    if (!r) return
  } else {
    const body: CreateCategory = {
      name: (payload as CreateSchema).name,
      kind: formState.parentId ? undefined : (payload as CreateSchema).kind,
      parentId: formState.parentId || undefined,
      color: (payload as CreateSchema).color || undefined,
      icon: (payload as CreateSchema).icon || undefined,
      sortOrder: 0,
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
                <UIcon name="i-lucide-tag" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  {{ isEditing ? 'Editar Categoría' : 'Registrar Nueva Categoría' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ isEditing ? 'Actualiza los datos de la categoría' : 'Crea un rubro o una partida (máx. 2 niveles)' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="categoria-form" :schema="schema" :state="formState" class="space-y-8" @submit="onSave">

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Datos de la Categoría
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Nombre" name="name">
                  <UInput v-model="formState.name" placeholder="Ej. Súper" class="w-full" />
                </UFormField>
                <UFormField v-if="!isEditing" label="Naturaleza (solo rubros)" name="kind">
                  <USelectMenu
                    v-model="formState.kind"
                    :items="kindItems"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>
                <UFormField v-if="!isEditing" label="Rubro padre (vacío = rubro)" name="parentId">
                  <USelectMenu
                    v-model="formState.parentId"
                    :items="rubroItems"
                    value-key="value"
                    label-key="label"
                    placeholder="— Es rubro (sin padre) —"
                    class="w-full"
                  />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Color" name="color">
                    <UInput v-model="formState.color" type="color" class="w-full" />
                  </UFormField>
                  <UFormField label="Icono" name="icon">
                    <UInput v-model="formState.icon" placeholder="shopping-cart" class="w-full" />
                  </UFormField>
                </div>
                <UFormField v-if="isEditing" label="Activa" name="isActive">
                  <USwitch v-model="formState.isActive" />
                </UFormField>
              </div>
            </div>

          </UForm>
        </div>

        <div class="bg-white/[0.02] flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-neutral-700">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="categoria-form" color="primary" variant="solid" :label="isEditing ? 'Guardar Cambios' : 'Registrar Categoría'" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
