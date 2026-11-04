<script setup lang="ts">
import { parseDate, type DateValue } from '@internationalized/date'
import type { CalendarEvent } from '~/services/budget-calendar.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  evento?: CalendarEvent | null
  diaInicial?: string
  categorias: { value: string, label: string }[]
}>()
const emit = defineEmits(['refresh'])

const { create, update, remove } = useCalendarioPresupuestos()
const saving = ref(false)
const isEditing = computed(() => !!props.evento)

const form = reactive({
  categoryId: '',
  budgetId: '',
  title: '',
  amount: 0 as number,
  startDate: '',
  endDate: '',
  notes: '',
  color: '',
  isAllDay: true,
})

function toCal(v: string): DateValue | undefined {
  if (!v) return undefined
  try { return parseDate(v) } catch { return undefined }
}

const startCal = computed<DateValue | undefined>({
  get: () => toCal(form.startDate),
  set: v => { form.startDate = v ? v.toString() : '' },
})
const endCal = computed<DateValue | undefined>({
  get: () => toCal(form.endDate),
  set: v => { form.endDate = v ? v.toString() : '' },
})

const inicioOpen = ref(false)
const finOpen = ref(false)

watch(open, (v) => {
  if (!v) return
  if (props.evento) {
    Object.assign(form, {
      categoryId: props.evento.category.id,
      budgetId: props.evento.budgetId || '',
      title: props.evento.title || '',
      amount: props.evento.amount,
      startDate: props.evento.startDate,
      endDate: props.evento.endDate,
      notes: props.evento.notes || '',
      color: props.evento.color || '',
      isAllDay: props.evento.isAllDay,
    })
  } else {
    const d = props.diaInicial || new Date().toISOString().slice(0, 10)
    Object.assign(form, {
      categoryId: props.categorias[0]?.value || '', budgetId: '', title: '',
      amount: 0, startDate: d, endDate: d, notes: '', color: '', isAllDay: true,
    })
  }
})

function clean(v: string): string | undefined {
  return v.trim() ? v.trim() : undefined
}

async function guardar() {
  if (!form.categoryId || !form.startDate || !form.endDate) return
  saving.value = true
  try {
    const base = {
      categoryId: form.categoryId,
      budgetId: clean(form.budgetId),
      title: clean(form.title),
      amount: Number(form.amount),
      startDate: form.startDate,
      endDate: form.endDate,
      notes: clean(form.notes),
      color: clean(form.color),
      isAllDay: form.isAllDay,
    }
    const r = isEditing.value && props.evento
      ? await update(props.evento.id, base)
      : await create(base)
    if (!r) return
    open.value = false
    emit('refresh')
  } finally {
    saving.value = false
  }
}

async function eliminar() {
  if (!props.evento) return
  await remove(props.evento.id)
  open.value = false
  emit('refresh')
}
</script>

<template>
  <UDrawer direction="right" v-model:open="open" :dismissible="false" :handle="false">
    <template #content>
      <div class="flex flex-col w-150 h-full">
        <div class="bg-elevated/60 p-6 pb-4 shrink-0 border-b border-default">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary shrink-0">
                <UIcon name="i-lucide-calendar-plus" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">{{ isEditing ? 'Editar evento' : 'Agendar presupuesto' }}</h3>
                <p class="text-xs text-muted">{{ isEditing ? 'Mueve las fechas o edita los datos' : 'Un día o barra multidía estilo Google Calendar' }}</p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="open = false" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <UForm :state="form" class="space-y-4" @submit="guardar">
            <UFormField label="Categoría" name="categoryId" required>
              <USelect v-model="form.categoryId" :items="props.categorias" class="w-full" />
            </UFormField>
            <UFormField label="Título" name="title" hint="Por defecto el nombre de la categoría">
              <UInput v-model="form.title" placeholder="Ej. Nuxt Conf" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Monto" name="amount" required>
                <UInput v-model="form.amount" type="number" min="0" step="0.01" class="w-full" />
              </UFormField>
              <UFormField label="Color" name="color" hint="#RRGGBB">
                <div class="flex gap-2">
                  <UInput v-model="form.color" placeholder="#3b82f6" class="w-full" />
                  <input v-model="form.color" type="color" class="size-9 rounded cursor-pointer bg-transparent" aria-label="Color" >
                </div>
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Inicio" name="startDate" required>
                <UPopover v-model:open="inicioOpen" :content="{ align: 'start' }">
                  <UButton icon="i-lucide-calendar-days" color="neutral" variant="outline" class="w-full justify-start font-normal">
                    <span :class="form.startDate ? 'text-highlighted' : 'text-muted'">{{ form.startDate || 'Seleccionar...' }}</span>
                  </UButton>
                  <template #content>
                    <UCalendar v-model="startCal" locale="es-MX" @update:model-value="inicioOpen = false" />
                  </template>
                </UPopover>
              </UFormField>
              <UFormField label="Fin" name="endDate" required>
                <UPopover v-model:open="finOpen" :content="{ align: 'start' }">
                  <UButton icon="i-lucide-calendar-days" color="neutral" variant="outline" class="w-full justify-start font-normal">
                    <span :class="form.endDate ? 'text-highlighted' : 'text-muted'">{{ form.endDate || 'Seleccionar...' }}</span>
                  </UButton>
                  <template #content>
                    <UCalendar v-model="endCal" locale="es-MX" @update:model-value="finOpen = false" />
                  </template>
                </UPopover>
              </UFormField>
            </div>
            <UFormField label="Notas" name="notes">
              <UTextarea v-model="form.notes" placeholder="Boletos + hotel" class="w-full" />
            </UFormField>
            <UFormField label="Día completo" name="isAllDay">
              <USwitch v-model="form.isAllDay" />
            </UFormField>
          </UForm>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-between gap-3 px-4 py-4 border-t border-default">
          <UButton v-if="isEditing" color="error" variant="ghost" label="Eliminar" icon="i-lucide-trash-2" @click="eliminar" />
          <div class="flex gap-3 ml-auto">
            <UButton color="neutral" variant="outline" label="Cancelar" @click="open = false" />
            <UButton color="primary" :loading="saving" :label="isEditing ? 'Guardar' : 'Agendar'" @click="guardar" />
          </div>
        </div>
      </div>
    </template>
  </UDrawer>
</template>
