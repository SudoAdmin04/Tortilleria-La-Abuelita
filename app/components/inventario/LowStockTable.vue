<script setup lang="ts">
import type { LowStockItem } from '~/services/inventory.service'

defineProps<{
  items: LowStockItem[]
  loading: boolean
}>()

const emit = defineEmits<{ adjust: [item: LowStockItem] }>()
</script>

<template>
  <UCard
    class="border border-default overflow-hidden"
    :ui="{
      header: 'py-3.5 px-5 border-b border-default bg-elevated/60',
      body: 'p-0 overflow-x-auto',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-triangle-alert" class="size-4 text-amber-600 dark:text-amber-400" />
          <span class="text-sm font-bold text-highlighted tracking-wide">Stock bajo</span>
        </div>
        <UBadge v-if="items.length" size="sm" color="warning" variant="subtle" class="px-2.5 font-semibold">
          {{ items.length }} {{ items.length === 1 ? 'Artículo' : 'Artículos' }}
        </UBadge>
      </div>
    </template>

    <table class="w-full text-sm">
      <thead class="bg-elevated/60 text-muted text-xs uppercase tracking-wider">
        <tr>
          <th class="text-left font-semibold px-4 py-2.5">Artículo</th>
          <th class="text-right font-semibold px-4 py-2.5">Stock</th>
          <th class="text-right font-semibold px-4 py-2.5">Mínimo</th>
          <th class="text-right font-semibold px-4 py-2.5">Déficit</th>
          <th class="text-right font-semibold px-4 py-2.5">Acción</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-if="loading">
          <td colspan="5" class="px-4 py-8 text-center text-muted">Cargando alertas...</td>
        </tr>
        <tr v-else-if="!items.length">
          <td colspan="5" class="px-4 py-10 text-center text-muted">
            Todo el inventario está por encima del mínimo.
          </td>
        </tr>
        <template v-else>
          <tr v-for="item in items" :key="`${item.itemType}-${item.id}`" class="hover:bg-elevated/50 transition-colors duration-150">
            <td class="px-4 py-2.5">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-highlighted font-medium truncate max-w-72">{{ item.name }}</span>
                <UBadge :color="item.itemType === 'supply' ? 'neutral' : 'primary'" variant="subtle" size="sm" class="shrink-0">
                  {{ item.itemType === 'supply' ? 'Insumo' : 'Producto' }}
                </UBadge>
              </div>
            </td>
            <td class="px-4 py-2.5 text-right text-amber-600 dark:text-amber-400 font-semibold whitespace-nowrap">{{ item.stock }} {{ item.unit }}</td>
            <td class="px-4 py-2.5 text-right text-toned whitespace-nowrap">{{ item.minStock }} {{ item.unit }}</td>
            <td class="px-4 py-2.5 text-right text-red-600 dark:text-red-400 font-semibold whitespace-nowrap">{{ item.deficit }} {{ item.unit }}</td>
            <td class="px-4 py-2.5 text-right">
              <UButton
                color="neutral"
                variant="outline"
                size="xs"
                icon="i-lucide-sliders-horizontal"
                label="Ajustar"
                @click="emit('adjust', item)"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </UCard>
</template>
