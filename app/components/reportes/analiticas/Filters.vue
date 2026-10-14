<script setup lang="ts">
const year = defineModel<number>('year', { default: new Date().getFullYear() })
const month = defineModel<number>('month', { default: new Date().getMonth() + 1 })
const months = defineModel<number>('months', { default: 6 })
const target = defineModel<number>('target', { default: 15 })
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
// Cantidad de meses de historial: 2-60 (5 años).
const monthsItems = [2, 3, 6, 9, 12, 18, 24, 36, 48, 60].map(m => ({ value: m, label: `${m} meses` }))
const targetItems = [5, 10, 15, 20, 25, 30].map(t => ({ value: t, label: `${t}%` }))

function today() {
  const n = new Date()
  year.value = n.getFullYear()
  month.value = n.getMonth() + 1
  emit('filtrar')
}
</script>

<template>
  <UCard class="border border-white/10" :ui="{ body: 'p-4 flex flex-wrap items-center gap-2' }">
    <span class="text-xs font-semibold uppercase tracking-widest text-white/45">Cierre</span>
    <USelectMenu v-model="month" :items="monthItems" value-key="value" label-key="label" class="w-36" aria-label="Mes de cierre" @update:model-value="emit('filtrar')" />
    <USelectMenu v-model="year" :items="yearItems" value-key="value" label-key="label" class="w-28" aria-label="Año de cierre" @update:model-value="emit('filtrar')" />
    <span class="text-xs font-semibold uppercase tracking-widest text-white/45 ml-2">Historial</span>
    <USelectMenu v-model="months" :items="monthsItems" value-key="value" label-key="label" class="w-32" aria-label="Meses de historial" @update:model-value="emit('filtrar')" />
    <span class="text-xs font-semibold uppercase tracking-widest text-white/45 ml-2">Meta ahorro</span>
    <USelectMenu v-model="target" :items="targetItems" value-key="value" label-key="label" class="w-24" aria-label="Meta de ahorro" @update:model-value="emit('filtrar')" />
    <UButton label="Hoy" color="neutral" variant="outline" size="sm" @click="today" />
    <UButton label="Actualizar" color="neutral" variant="outline" size="sm" icon="i-lucide-refresh-cw" :loading="props.loading" @click="emit('filtrar')" />
    <div class="flex-1" />
    <slot />
  </UCard>
</template>
