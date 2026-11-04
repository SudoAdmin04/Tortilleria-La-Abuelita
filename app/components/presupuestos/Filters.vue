<script setup lang="ts">
const year = defineModel<number>('year', { default: new Date().getFullYear() })
const month = defineModel<number>('month', { default: new Date().getMonth() + 1 })
const emit = defineEmits(['filtrar', 'limpiar'])

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

function prev() {
  const d = new Date(year.value, month.value - 2, 1)
  year.value = d.getFullYear()
  month.value = d.getMonth() + 1
  emit('filtrar')
}

function next() {
  const d = new Date(year.value, month.value, 1)
  year.value = d.getFullYear()
  month.value = d.getMonth() + 1
  emit('filtrar')
}

function today() {
  const n = new Date()
  year.value = n.getFullYear()
  month.value = n.getMonth() + 1
  emit('filtrar')
}
</script>

<template>
  <UCard class="border border-default" :ui="{ body: 'p-4 flex flex-wrap items-center gap-2' }">
    <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="sm" aria-label="Mes anterior" @click="prev" />
    <USelectMenu v-model="month" :items="monthItems" value-key="value" label-key="label" class="w-36" @update:model-value="emit('filtrar')" />
    <USelectMenu v-model="year" :items="yearItems" value-key="value" label-key="label" class="w-28" @update:model-value="emit('filtrar')" />
    <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="sm" aria-label="Mes siguiente" @click="next" />
    <UButton label="Hoy" color="neutral" variant="outline" size="sm" @click="today" />
    <div class="flex-1" />
    <slot />
  </UCard>
</template>
