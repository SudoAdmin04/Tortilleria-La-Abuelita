<script setup lang="ts">
import type { InventoryItemType, InventoryMovementType } from '~/services/inventory.service'

const itemType = defineModel<InventoryItemType | undefined>('itemType', { default: undefined })
const type = defineModel<InventoryMovementType | undefined>('type', { default: undefined })
const from = defineModel<string | undefined>('from', { default: undefined })
const to = defineModel<string | undefined>('to', { default: undefined })

const emit = defineEmits<{ filtrar: []; limpiar: [] }>()

const itemTypeItems = [
  { value: undefined, label: 'Insumos y productos' },
  { value: 'supply', label: 'Solo insumos' },
  { value: 'product', label: 'Solo productos' },
]

const movementTypeItems = [
  { value: undefined, label: 'Todos los movimientos' },
  { value: 'initial', label: 'Inicial' },
  { value: 'purchase', label: 'Compra' },
  { value: 'sale', label: 'Venta' },
  { value: 'production_input', label: 'Consumo de producción' },
  { value: 'production_output', label: 'Producción' },
  { value: 'adjustment_in', label: 'Ajuste de entrada' },
  { value: 'adjustment_out', label: 'Ajuste de salida' },
  { value: 'waste', label: 'Merma' },
  { value: 'return_in', label: 'Devolución de entrada' },
  { value: 'return_out', label: 'Devolución de salida' },
]

const hayFiltros = computed(() => !!itemType.value || !!type.value || !!from.value || !!to.value)
</script>

<template>
  <UCard
    class="border border-default"
    :ui="{
      header: 'py-3 px-4 sm:px-5 border-b border-default bg-elevated/60',
      body: 'p-4 sm:p-5',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <UIcon name="i-lucide-list-filter" class="size-4 text-muted shrink-0" />
          <span class="text-sm font-bold text-highlighted tracking-wide">Filtros del kardex</span>
        </div>
        <UButton
          v-if="hayFiltros"
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-x"
          label="Limpiar filtros"
          class="shrink-0 text-muted hover:text-highlighted"
          @click="emit('limpiar')"
        />
      </div>
    </template>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <UFormField label="Artículo" size="sm" class="w-full">
        <USelectMenu
          v-model="itemType"
          :items="itemTypeItems"
          value-key="value"
          label-key="label"
          placeholder="Insumos y productos"
          icon="i-lucide-boxes"
          class="w-full"
          @update:model-value="emit('filtrar')"
        />
      </UFormField>
      <UFormField label="Tipo de movimiento" size="sm" class="w-full">
        <USelectMenu
          v-model="type"
          :items="movementTypeItems"
          value-key="value"
          label-key="label"
          placeholder="Todos los movimientos"
          icon="i-lucide-arrow-left-right"
          class="w-full"
          @update:model-value="emit('filtrar')"
        />
      </UFormField>
      <UFormField label="Desde" size="sm" class="w-full">
        <UInput v-model="from" type="date" class="w-full" @change="emit('filtrar')" />
      </UFormField>
      <UFormField label="Hasta" size="sm" class="w-full">
        <UInput v-model="to" type="date" class="w-full" @change="emit('filtrar')" />
      </UFormField>
    </div>
  </UCard>
</template>
