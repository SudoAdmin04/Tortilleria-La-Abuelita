<script setup lang="ts">
import type { ProductionStatus } from '~/services/production.service'

export interface ProductoOpt { value: string; label: string }

const productId = defineModel<string | undefined>('productId', { default: undefined })
const status = defineModel<ProductionStatus | undefined>('status', { default: undefined })
const from = defineModel<string | undefined>('from', { default: undefined })
const to = defineModel<string | undefined>('to', { default: undefined })

const props = withDefaults(defineProps<{ productos?: ProductoOpt[] }>(), {
  productos: () => [],
})

const emit = defineEmits<{ filtrar: []; limpiar: [] }>()

const tabs = [
  { value: undefined as ProductionStatus | undefined, label: 'Todos' },
  { value: 'completed' as ProductionStatus, label: 'Completados' },
  { value: 'cancelled' as ProductionStatus, label: 'Cancelados' },
]

const hayFiltros = computed(() => !!productId.value || !!status.value || !!from.value || !!to.value)

function setStatus(v: ProductionStatus | undefined) {
  if (status.value === v) return
  status.value = v
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
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <UIcon name="i-lucide-list-filter" class="size-4 text-muted shrink-0" />
          <span class="text-sm font-bold text-highlighted tracking-wide">Filtros</span>
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

    <div class="flex flex-wrap items-center gap-1.5 rounded-xl bg-elevated/60 border border-muted p-1.5 w-fit max-w-full">
      <UButton
        v-for="t in tabs"
        :key="t.label"
        size="sm"
        :color="status === t.value ? 'primary' : 'neutral'"
        :variant="status === t.value ? 'solid' : 'ghost'"
        class="rounded-lg font-semibold"
        @click="setStatus(t.value)"
      >
        {{ t.label }}
      </UButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <UFormField label="Producto" size="sm" class="w-full">
        <USelectMenu
          v-model="productId"
          :items="[{ value: undefined, label: 'Todos los productos' }, ...props.productos]"
          value-key="value"
          label-key="label"
          placeholder="Todos los productos"
          icon="i-lucide-cookie"
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
