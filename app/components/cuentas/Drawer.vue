<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSchema, editSchema, type CreateSchema, type EditSchema } from '~/schemas/cuentas.schema'
import type { Account, CreateAccount, UpdateAccount } from '~/services/accounts.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  cuenta?: Account | null
}>()
const emit = defineEmits(['refresh'])

const { create, update } = useCuentas()
const auth = useAuthStore()
const isEditing = computed(() => !!props.cuenta)

const schema = computed(() => (isEditing.value ? editSchema : createSchema))

const formState = reactive({
  name: '',
  type: 'checking' as Account['type'],
  institution: '',
  last4: '',
  currency: 'MXN',
  initialBalance: 0 as number,
  creditLimit: '' as string,
  isPrimary: false,
  isActive: true,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.cuenta) {
    Object.assign(formState, {
      name: props.cuenta.name,
      type: props.cuenta.type,
      institution: props.cuenta.institution || '',
      last4: props.cuenta.last4 || '',
      currency: props.cuenta.currency || 'MXN',
      initialBalance: props.cuenta.initialBalance ?? 0,
      creditLimit: props.cuenta.creditLimit != null ? String(props.cuenta.creditLimit) : '',
      isPrimary: props.cuenta.isPrimary,
      isActive: props.cuenta.isActive,
    })
  } else {
    Object.assign(formState, {
      name: '',
      type: 'checking',
      institution: '',
      last4: '',
      currency: auth.user?.currency || 'MXN',
      initialBalance: 0,
      creditLimit: '',
      isPrimary: false,
      isActive: true,
    })
  }
})

const tipoItems = [
  { value: 'checking', label: 'Cheques' },
  { value: 'savings', label: 'Ahorro' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'credit_card', label: 'Tarjeta' },
]

/** '' → undefined para no enviar strings vacíos al backend. */
function cleanText(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

function cleanCreditLimit(v: unknown): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const onSave = async (event: FormSubmitEvent<CreateSchema | EditSchema>) => {
  const payload = event.data
  if (isEditing.value && props.cuenta) {
    const body: UpdateAccount = {
      name: (payload as EditSchema).name,
      type: (payload as EditSchema).type,
      institution: cleanText((payload as EditSchema).institution),
      last4: cleanText((payload as EditSchema).last4),
      currency: (payload as EditSchema).currency,
      initialBalance: Number((payload as EditSchema).initialBalance),
      creditLimit: cleanCreditLimit((payload as EditSchema).creditLimit),
      isPrimary: (payload as EditSchema).isPrimary,
      isActive: formState.isActive,
    }
    const r = await update(props.cuenta.id, body)
    if (!r) return
  } else {
    const body: CreateAccount = {
      name: (payload as CreateSchema).name,
      type: (payload as CreateSchema).type ?? 'checking',
      institution: cleanText((payload as CreateSchema).institution),
      last4: cleanText((payload as CreateSchema).last4),
      currency: (payload as CreateSchema).currency || 'MXN',
      initialBalance: Number((payload as CreateSchema).initialBalance ?? 0),
      creditLimit: cleanCreditLimit((payload as CreateSchema).creditLimit),
      isPrimary: !!(payload as CreateSchema).isPrimary,
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
                <UIcon name="i-lucide-wallet" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  {{ isEditing ? 'Editar Cuenta' : 'Registrar Nueva Cuenta' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ isEditing ? 'Actualiza los datos de la cuenta' : 'Registra un banco, efectivo o tarjeta' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="cuenta-form" :schema="schema" :state="formState" class="space-y-8" @submit="onSave">

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">1</span>
                Datos de la Cuenta
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <UFormField label="Nombre" name="name" required>
                  <UInput v-model="formState.name" placeholder="Ej. Nómina BBVA" class="w-full" />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Tipo" name="type" required>
                    <USelectMenu
                      v-model="formState.type"
                      :items="tipoItems"
                      value-key="value"
                      label-key="label"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Moneda" name="currency" required hint="Código ISO">
                    <UInput v-model="formState.currency" placeholder="MXN" class="w-full" />
                  </UFormField>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Institución" name="institution" hint="Banco (opcional)">
                    <UInput v-model="formState.institution" placeholder="BBVA" class="w-full" />
                  </UFormField>
                  <UFormField label="Últimos 4 dígitos" name="last4" hint="Solo tarjetas/cuentas">
                    <UInput v-model="formState.last4" placeholder="1234" maxlength="4" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </div>

            <USeparator />

            <div>
              <h3 class="text-base font-semibold leading-7 flex items-center gap-2 mb-4">
                <span class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">2</span>
                Saldos y Preferencias
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Saldo inicial" name="initialBalance" required hint="El balance se calcula con movimientos">
                    <UInput v-model="formState.initialBalance" type="number" step="0.01" class="w-full" />
                  </UFormField>
                  <UFormField v-if="formState.type === 'credit_card'" label="Límite de crédito" name="creditLimit">
                    <UInput v-model="formState.creditLimit" type="number" min="0" step="0.01" placeholder="30000" class="w-full" />
                  </UFormField>
                </div>
                <UFormField label="Principal" name="isPrimary" hint="Desmarca la anterior principal">
                  <USwitch v-model="formState.isPrimary" />
                </UFormField>
                <UFormField v-if="isEditing" label="Activa" name="isActive" hint="Inactiva no aparece en liquidez">
                  <USwitch v-model="formState.isActive" />
                </UFormField>
              </div>
            </div>

          </UForm>
        </div>

        <div class="bg-white/[0.02] flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-neutral-700">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton type="submit" form="cuenta-form" color="primary" variant="solid" :label="isEditing ? 'Guardar Cambios' : 'Registrar Cuenta'" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
