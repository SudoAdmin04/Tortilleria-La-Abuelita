<script setup lang="ts">
const isActive = defineModel<boolean | undefined>('isActive', { default: undefined })
const lowStock = defineModel<boolean | undefined>('lowStock', { default: undefined })
const emit = defineEmits<{ filtrar: []; limpiar: [] }>()

const tabs = [
  { value: undefined as boolean | undefined, label: 'Todos' },
  { value: true, label: 'Activos' },
  { value: false, label: 'Inactivos' },
]

const hayFiltros = computed(() => isActive.value !== undefined || !!lowStock.value)

function setEstado(v: boolean | undefined) {
  if (isActive.value === v) return
  isActive.value = v
  emit('filtrar')
}

function setLowStock(v: boolean) {
  lowStock.value = v ? true : undefined
  emit('filtrar')
}
</script>

<template>
  <UCard
    class="border border-default"
    :ui="{ body: 'p-4 sm:p-5 flex flex-wrap items-center gap-4' }"
  >
    <div class="flex items-center gap-2">
      <UIcon name="i-lucide-list-filter" class="size-4 text-muted" />
      <span class="text-sm font-bold text-highlighted tracking-wide">Filtros</span>
    </div>

    <div class="flex flex-wrap items-center gap-1.5 rounded-xl bg-elevated/60 border border-muted p-1.5 w-fit max-w-full">
      <UButton
        v-for="t in tabs"
        :key="t.label"
        size="sm"
        :color="isActive === t.value ? 'primary' : 'neutral'"
        :variant="isActive === t.value ? 'solid' : 'ghost'"
        class="rounded-lg font-semibold"
        @click="setEstado(t.value)"
      >
        {{ t.label }}
      </UButton>
    </div>

    <label class="flex items-center gap-2.5 cursor-pointer select-none">
      <USwitch :model-value="!!lowStock" @update:model-value="setLowStock" />
      <span class="text-sm text-toned">Solo stock bajo</span>
    </label>

    <div class="flex-1" />
    <UButton
      v-if="hayFiltros"
      color="neutral"
      variant="ghost"
      size="xs"
      icon="i-lucide-x"
      label="Limpiar filtros"
      class="text-muted hover:text-highlighted"
      @click="emit('limpiar')"
    />
  </UCard>
</template>
