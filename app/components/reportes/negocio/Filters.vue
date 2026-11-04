<script setup lang="ts">
const from = defineModel<string>('from', { default: '' })
const to = defineModel<string>('to', { default: '' })

const props = withDefaults(defineProps<{ loading?: boolean }>(), { loading: false })
const emit = defineEmits<{ filtrar: [] }>()

const finDeMes = (year: number, month: number) => {
  const d = new Date(year, month, 0)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const inicioDeMes = (year: number, month: number) => {
  const m = `${month}`.padStart(2, '0')
  return `${year}-${m}-01`
}

function presetMesActual() {
  const now = new Date()
  from.value = inicioDeMes(now.getFullYear(), now.getMonth() + 1)
  to.value = finDeMes(now.getFullYear(), now.getMonth() + 1)
  emit('filtrar')
}

function presetMesAnterior() {
  const now = new Date()
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() === 0 ? 12 : now.getMonth()
  from.value = inicioDeMes(year, month)
  to.value = finDeMes(year, month)
  emit('filtrar')
}
</script>

<template>
  <UCard
    class="border border-default"
    :ui="{
      header: 'py-3 px-4 sm:px-5 border-b border-default bg-elevated/60',
      body: 'p-4 sm:p-5 flex flex-col gap-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-2 min-w-0">
        <UIcon name="i-lucide-calendar-range" class="size-4 text-muted shrink-0" />
        <span class="text-sm font-bold text-highlighted tracking-wide">Periodo</span>
      </div>
    </template>

    <div class="flex flex-col lg:flex-row lg:items-end gap-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
        <UFormField label="Desde" size="sm" class="w-full">
          <UInput v-model="from" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Hasta" size="sm" class="w-full">
          <UInput v-model="to" type="date" class="w-full" />
        </UFormField>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UButton color="neutral" variant="outline" size="sm" label="Mes actual" @click="presetMesActual" />
        <UButton color="neutral" variant="outline" size="sm" label="Mes anterior" @click="presetMesAnterior" />
        <UButton color="primary" size="sm" icon="i-lucide-refresh-cw" label="Aplicar" :loading="props.loading" @click="emit('filtrar')" />
      </div>
    </div>
  </UCard>
</template>
