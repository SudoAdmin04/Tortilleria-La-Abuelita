<script setup lang="ts">
import type { Budget } from '~/services/budgets.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  presupuesto?: Budget | null
  year: number
  month: number
  categorias: { value: string, label: string }[]
}>()
const emit = defineEmits(['refresh'])

const { create, update } = usePresupuestos()
const saving = ref(false)
const isEditing = computed(() => !!props.presupuesto)

const form = reactive({ categoryId: '', amount: 0 as number, reason: '' })

watch(open, (v) => {
  if (!v) return
  if (props.presupuesto) {
    Object.assign(form, { categoryId: props.presupuesto.categoryId, amount: props.presupuesto.amount, reason: '' })
  } else {
    Object.assign(form, { categoryId: props.categorias[0]?.value || '', amount: 0, reason: '' })
  }
})

async function guardar() {
  saving.value = true
  try {
    if (isEditing.value && props.presupuesto) {
      const r = await update(props.presupuesto.id, { amount: Number(form.amount), reason: form.reason?.trim() || undefined })
      if (!r) return
    } else {
      const r = await create({ categoryId: form.categoryId, year: props.year, month: props.month, amount: Number(form.amount) })
      if (!r) return
    }
    open.value = false
    emit('refresh')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UDrawer direction="right" v-model:open="open" :dismissible="false" :handle="false">
    <template #content>
      <div class="flex flex-col w-150 h-full">
        <div class="bg-elevated/60 p-6 pb-4 flex flex-col gap-4 shrink-0 border-b border-default">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary shrink-0">
                <UIcon name="i-lucide-wallet" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ isEditing ? 'Ajustar presupuesto' : 'Nuevo presupuesto' }}
                </h3>
                <p class="text-xs text-muted">
                  {{ isEditing ? 'Cambia el límite y deja el motivo en el historial' : 'Define el límite mensual de una categoría' }}
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="open = false" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm :state="form" class="space-y-4" @submit="guardar">
            <UFormField label="Categoría" name="categoryId" required>
              <USelect v-model="form.categoryId" :items="props.categorias" class="w-full" :disabled="isEditing" />
            </UFormField>
            <UFormField label="Monto límite" name="amount" required>
              <UInput v-model="form.amount" type="number" min="0" step="0.01" class="w-full" />
            </UFormField>
            <UFormField v-if="isEditing" label="Motivo del ajuste" name="reason" hint="Visible en el historial">
              <UInput v-model="form.reason" placeholder="Ej. Ajuste por inflación" class="w-full" />
            </UFormField>
          </UForm>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton color="neutral" variant="outline" label="Cancelar" @click="open = false" />
          <UButton color="primary" :loading="saving" :label="isEditing ? 'Guardar ajuste' : 'Crear presupuesto'" @click="guardar" />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
