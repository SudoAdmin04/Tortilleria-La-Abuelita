<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { depositoSchema, retiroSchema, type DepositoSchema, type RetiroSchema } from '~/schemas/metas.schema'
import type { SavingsGoal } from '~/services/savings-goals.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  goal?: SavingsGoal | null
  tipo?: 'deposit' | 'withdraw'
  cuentas?: { value: string; label: string }[]
}>()
const emit = defineEmits(['saved'])

const { deposit, withdraw, movimientoLoading } = useMetasAhorro()

const esAporte = computed(() => (props.tipo ?? 'deposit') === 'deposit')
const schema = computed(() => (esAporte.value ? depositoSchema : retiroSchema))

function hoy(): string {
  return new Date().toISOString().slice(0, 10)
}

const formState = reactive({
  amount: undefined as number | undefined,
  date: hoy(),
  fromAccountId: '',
  toAccountId: '',
  concept: '',
})

watch([open, () => props.goal, () => props.tipo], ([isOpen]) => {
  if (!isOpen) return
  Object.assign(formState, {
    amount: undefined,
    date: hoy(),
    fromAccountId: '',
    toAccountId: '',
    concept: '',
  })
})

const cuentaOrigenItems = computed(() => [...(props.cuentas ?? [])])
const cuentaDestinoItems = computed(() => [
  { value: '', label: '— Por defecto (última operativa) —' },
  ...(props.cuentas ?? []),
])

const onSave = async (event: FormSubmitEvent<DepositoSchema | RetiroSchema>) => {
  if (!props.goal) return
  const data = event.data
  const concept = typeof data.concept === 'string' && data.concept.trim() !== '' ? data.concept.trim() : undefined
  if (esAporte.value) {
    const d = data as DepositoSchema
    const r = await deposit(props.goal.id, {
      amount: Number(d.amount),
      date: d.date,
      fromAccountId: d.fromAccountId,
      ...(concept ? { concept } : {}),
    })
    if (!r) return
  } else {
    const d = data as RetiroSchema
    const toAccountId = typeof d.toAccountId === 'string' && d.toAccountId !== '' ? d.toAccountId : undefined
    const r = await withdraw(props.goal.id, {
      amount: Number(d.amount),
      date: d.date,
      ...(toAccountId ? { toAccountId } : {}),
      ...(concept ? { concept } : {}),
    })
    if (!r) return
  }
  open.value = false
  emit('saved')
}
</script>

<template>
  <UDrawer direction="right" v-model:open="open" :dismissible="false" :handle="false">
    <template #content>
      <div class="flex flex-col w-150 h-full">

        <div class="bg-white/[0.02] p-6 pb-4 flex flex-col gap-4 shrink-0 border-b border-neutral-700">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div
                class="flex items-center justify-center p-2 rounded-lg shrink-0"
                :class="esAporte ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'"
              >
                <UIcon :name="esAporte ? 'i-lucide-plus-circle' : 'i-lucide-minus-circle'" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  {{ esAporte ? 'Aportar a la meta' : 'Retirar de la meta' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ props.goal?.name ?? 'Meta' }}{{ esAporte ? ' · suma saldo y mueve dinero a la reserva' : ' · resta saldo (no puede excederlo)' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm id="meta-movimiento-form" :schema="schema" :state="formState" class="space-y-4" @submit="onSave">
            <UFormField label="Monto" name="amount" required>
              <UInput v-model="formState.amount" type="number" min="0.01" step="0.01" placeholder="1500" class="w-full" />
            </UFormField>
            <UFormField label="Fecha contable" name="date" required hint="YYYY-MM-DD">
              <UInput v-model="formState.date" type="date" class="w-full" />
            </UFormField>
            <UFormField
              v-if="esAporte"
              label="Cuenta origen (operativa)"
              name="fromAccountId"
              required
              hint="Si la meta tiene cuenta reserva, se crea un transfer real hacia ella"
            >
              <USelectMenu
                v-model="formState.fromAccountId"
                :items="cuentaOrigenItems"
                value-key="value"
                label-key="label"
                placeholder="Selecciona la cuenta origen"
                class="w-full"
              />
            </UFormField>
            <UFormField
              v-else
              label="Cuenta destino (operativa)"
              name="toAccountId"
              hint="Por defecto la operativa del último aporte"
            >
              <USelectMenu
                v-model="formState.toAccountId"
                :items="cuentaDestinoItems"
                value-key="value"
                label-key="label"
                placeholder="— Por defecto —"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Concepto" name="concept" hint="Opcional">
              <UInput v-model="formState.concept" placeholder="Ej. Aporte quincenal" class="w-full" />
            </UFormField>
          </UForm>
        </div>

        <div class="bg-white/[0.02] flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-neutral-700">
          <UButton type="button" color="neutral" variant="outline" label="Cancelar" @click="() => { open = false }" />
          <UButton
            type="submit"
            form="meta-movimiento-form"
            :color="esAporte ? 'success' : 'warning'"
            variant="solid"
            :loading="movimientoLoading"
            :label="esAporte ? 'Registrar aporte' : 'Registrar retiro'"
          />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
