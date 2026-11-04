<script setup lang="ts">
const year = defineModel<number>('year', { default: new Date().getFullYear() })
const month = defineModel<number>('month', { default: new Date().getMonth() + 1 })
const emit = defineEmits(['filtrar'])

const props = withDefaults(defineProps<{
  loading?: boolean
}>(), { loading: false })

const monthItems = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
]
const yearItems = Array.from({ length: 7 }, (_, i) => {
  const y = new Date().getFullYear() - 3 + i
  return { value: y, label: `${y}` }
})

function today() {
  const n = new Date()
  year.value = n.getFullYear()
  month.value = n.getMonth() + 1
  emit('filtrar')
}
</script>

<template>
  <UCard class="border border-default" :ui="{ body: 'p-4 flex flex-wrap items-center gap-2' }">
    <span class="text-xs font-semibold uppercase tracking-widest text-muted">Periodo</span>
    <USelectMenu v-model="month" :items="monthItems" value-key="value" label-key="label" class="w-36" aria-label="Mes" @update:model-value="emit('filtrar')" />
    <USelectMenu v-model="year" :items="yearItems" value-key="value" label-key="label" class="w-28" aria-label="Año" @update:model-value="emit('filtrar')" />
    <UButton label="Hoy" color="neutral" variant="outline" size="sm" @click="today" />
    <UButton label="Actualizar" color="neutral" variant="outline" size="sm" icon="i-lucide-refresh-cw" :loading="props.loading" @click="emit('filtrar')" />
    <div class="flex-1" />
    <slot />
  </UCard>
</template>
