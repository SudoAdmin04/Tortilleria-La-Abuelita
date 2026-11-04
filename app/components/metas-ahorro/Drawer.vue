<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/metas.schema'
import type { SavingsGoal, CreateSavingsGoal, UpdateSavingsGoal } from '~/services/savings-goals.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  meta?: SavingsGoal | null
  cuentas?: { value: string; label: string }[]
  categorias?: { value: string; label: string }[]
}>()
const emit = defineEmits(['refresh'])

const { create, update } = useMetasAhorro()
const isEditing = computed(() => !!props.meta)

const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  name: '',
  monthlyContribution: undefined as number | undefined,
  targetAmount: '' as string,
  accountId: '',
  categoryId: '',
  isActive: true,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.meta) {
    Object.assign(formState, {
      name: props.meta.name,
      monthlyContribution: props.meta.monthlyContribution,
      targetAmount: props.meta.targetAmount != null ? String(props.meta.targetAmount) : '',
      accountId: props.meta.accountId || '',
      categoryId: props.meta.categoryId || '',
      isActive: props.meta.isActive,
    })
  } else {
    Object.assign(formState, {
      name: '',
      monthlyContribution: undefined,
      targetAmount: '',
      accountId: '',
      categoryId: '',
      isActive: true,
    })
  }
})

const cuentaItems = computed(() => [
  { value: '', label: '— Ninguna —' },
  ...((props.cuentas ?? [])),
])

const categoriaItems = computed(() => [
  { value: '', label: '— Ninguna —' },
  ...((props.categorias ?? [])),
])

function cleanId(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined
}

function cleanTarget(v: unknown): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const payload = event.data
  if (isEditing.value && props.meta) {
    const body: UpdateSavingsGoal = {
      name: (payload as EditSchema).name,
      monthlyContribution: (payload as EditSchema).monthlyContribution,
      targetAmount: cleanTarget((payload as EditSchema).targetAmount),
      accountId: cleanId((payload as EditSchema).accountId),
      categoryId: cleanId((payload as EditSchema).categoryId),
      isActive: formState.isActive,
    }
    const r = await update(props.meta.id, body)
    if (!r) return
  } else {
    const body: CreateSavingsGoal = {
      name: (payload as CreateSchema).name,
      monthlyContribution: Number((payload as CreateSchema).monthlyContribution),
      targetAmount: cleanTarget((payload as CreateSchema).targetAmount),
      accountId: cleanId((payload as CreateSchema).accountId),
      categoryId: cleanId((payload as CreateSchema).categoryId),
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
                <UIcon name="i-lucide-trophy" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ isEditing ? 'Editar Meta' : 'Registrar Nueva Meta' }}
                </h3>
                <p class="text-xs text-muted">
                  {{ isEditing ? 'Actualiza los datos de la meta de ahorro' : 'Registra una nueva meta de ahorro' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="meta-form" :schema="schema" :state="formState" class="space-y-8" @submit="onSave">

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Datos de la Meta
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Nombre" name="name" required>
                  <UInput v-model="formState.name" placeholder="Ej. Reserva de emergencia" class="w-full" />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Aporte mensual" name="monthlyContribution" required hint="Se compara con los egresos del mes en su categoría">
                    <UInput v-model="formState.monthlyContribution" type="number" min="0.01" step="0.01" placeholder="2000" class="w-full" />
                  </UFormField>
                  <UFormField label="Objetivo total" name="targetAmount" hint="Opcional: calcula el % histórico">
                    <UInput v-model="formState.targetAmount" type="number" min="0" step="0.01" placeholder="30000" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </div>

            <USeparator />

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">2</span>
                Cuenta y Categoría
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Cuenta" name="accountId" hint="Cuenta donde vive el ahorro">
                  <USelectMenu
                    v-model="formState.accountId"
                    :items="cuentaItems"
                    value-key="value"
                    label-key="label"
                    placeholder="— Ninguna —"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Categoría (egresos que cuentan)" name="categoryId" hint="Los egresos del mes en esta categoría cuentan como aportes">
                  <USelectMenu
                    v-model="formState.categoryId"
                    :items="categoriaItems"
                    value-key="value"
                    label-key="label"
                    placeholder="— Ninguna —"
                    class="w-full"
                  />
                </UFormField>
                <UFormField v-if="isEditing" label="Activa" name="isActive">
                  <USwitch v-model="formState.isActive" />
                </UFormField>
              </div>
            </div>

          </UForm>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="meta-form" color="primary" variant="solid" :label="isEditing ? 'Guardar Cambios' : 'Registrar Meta'" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
