<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { parseDate, type DateValue } from '@internationalized/date'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/deudas.schema'
import type { Debt, CreateDebt, UpdateDebt } from '~/services/debts.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  deuda?: Debt | null
}>()
const emit = defineEmits(['refresh'])

const { create, update } = useDeudas()
const isEditing = computed(() => !!props.deuda)
const vencimientoOpen = ref(false)

const vencimientoCal = computed<DateValue | undefined>({
  get: () => {
    const v = formState.dueDate?.trim()
    if (!v) return undefined
    try {
      return parseDate(v)
    } catch {
      return undefined
    }
  },
  set: (v) => {
    formState.dueDate = v ? v.toString() : ''
  },
})

function etiquetaVencimiento(v: string): string {
  const partes = v.split('-')
  if (partes.length >= 3) return `${partes[2]}/${partes[1]}/${partes[0]}`
  return v
}

const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  name: '',
  direction: 'payable' as 'payable' | 'receivable',
  principalAmount: 0 as number,
  counterparty: '',
  reference: '',
  dueDate: '',
  notes: '',
  status: 'open' as 'open' | 'paid',
})

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.deuda) {
    Object.assign(formState, {
      name: props.deuda.name,
      direction: props.deuda.direction,
      principalAmount: props.deuda.principalAmount,
      counterparty: props.deuda.counterparty || '',
      reference: props.deuda.reference || '',
      dueDate: props.deuda.dueDate || '',
      notes: props.deuda.notes || '',
      status: props.deuda.status,
    })
  } else {
    Object.assign(formState, {
      name: '',
      direction: 'payable',
      principalAmount: 0,
      counterparty: '',
      reference: '',
      dueDate: '',
      notes: '',
      status: 'open',
    })
  }
})

const directionItems = [
  { value: 'payable', label: 'Yo debo (resta)' },
  { value: 'receivable', label: 'Me deben (suma)' },
]

const statusItems = [
  { value: 'open', label: 'Vigente' },
  { value: 'paid', label: 'Liquidada' },
]

function cleanText(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

function cleanDate(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined
}

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const payload = event.data
  if (isEditing.value && props.deuda) {
    const body: UpdateDebt = {
      name: (payload as EditSchema).name,
      direction: (payload as EditSchema).direction,
      principalAmount: (payload as EditSchema).principalAmount != null
        ? Number((payload as EditSchema).principalAmount)
        : undefined,
      counterparty: cleanText((payload as EditSchema).counterparty),
      reference: cleanText((payload as EditSchema).reference),
      dueDate: cleanDate((payload as EditSchema).dueDate),
      notes: cleanText((payload as EditSchema).notes),
      status: (payload as EditSchema).status,
    }
    const r = await update(props.deuda.id, body)
    if (!r) return
  } else {
    const body: CreateDebt = {
      name: (payload as CreateSchema).name,
      direction: (payload as CreateSchema).direction ?? 'payable',
      principalAmount: Number((payload as CreateSchema).principalAmount),
      counterparty: cleanText((payload as CreateSchema).counterparty),
      reference: cleanText((payload as CreateSchema).reference),
      dueDate: cleanDate((payload as CreateSchema).dueDate),
      notes: cleanText((payload as CreateSchema).notes),
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
                <UIcon name="i-lucide-banknote" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  {{ isEditing ? 'Editar Deuda' : 'Registrar Nueva Deuda' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ isEditing ? 'Actualiza los datos de la deuda' : 'Registra un pasivo por pagar o por cobrar' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="deuda-form" :schema="schema" :state="formState" class="space-y-8" @submit="onSave">

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Datos de la Deuda
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Nombre" name="name" required>
                  <UInput v-model="formState.name" placeholder="Ej. Préstamo auto" class="w-full" />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Dirección" name="direction" required>
                    <USelectMenu
                      v-model="formState.direction"
                      :items="directionItems"
                      value-key="value"
                      label-key="label"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Monto principal" name="principalAmount" required>
                    <UInput v-model="formState.principalAmount" type="number" min="0.01" step="0.01" class="w-full" />
                  </UFormField>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Contraparte" name="counterparty" hint="Banco o persona">
                    <UInput v-model="formState.counterparty" placeholder="Banco XYZ" class="w-full" />
                  </UFormField>
                  <UFormField label="Referencia" name="reference" hint="Contrato o folio">
                    <UInput v-model="formState.reference" placeholder="CRED-001" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </div>

            <USeparator />

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">2</span>
                Vencimiento y Estado
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Vencimiento" name="dueDate">
                  <UPopover v-model:open="vencimientoOpen" :content="{ align: 'start' }">
                    <UButton
                      icon="i-lucide-calendar-days"
                      color="neutral"
                      variant="outline"
                      class="w-full justify-start font-normal"
                    >
                      <span :class="formState.dueDate ? 'text-white' : 'text-white/40'">
                        {{ formState.dueDate ? etiquetaVencimiento(formState.dueDate) : 'Seleccionar fecha...' }}
                      </span>
                    </UButton>
                    <template #content>
                      <div class="p-2">
                        <UCalendar v-model="vencimientoCal" locale="es-MX" @update:model-value="() => { vencimientoOpen = false }" />
                        <UButton
                          v-if="formState.dueDate"
                          label="Sin vencimiento"
                          icon="i-lucide-calendar-x"
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          block
                          class="mt-1"
                          @click="() => { formState.dueDate = ''; vencimientoOpen = false }"
                        />
                      </div>
                    </template>
                  </UPopover>
                </UFormField>
                <UFormField label="Notas" name="notes">
                  <UTextarea v-model="formState.notes" placeholder="Mensualidad los días 15" class="w-full" />
                </UFormField>
                <UFormField v-if="isEditing" label="Estado" name="status">
                  <USelectMenu
                    v-model="formState.status"
                    :items="statusItems"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

          </UForm>
        </div>

        <div class="bg-white/[0.02] flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-neutral-700">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="deuda-form" color="primary" variant="solid" :label="isEditing ? 'Guardar Cambios' : 'Registrar Deuda'" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
