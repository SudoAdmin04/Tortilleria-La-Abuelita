<script setup lang="ts">
import type { InventoryMovement } from '~/services/inventory.service'
import type { Supply } from '~/services/supplies.service'
import type { Product } from '~/services/products.service'
import { formatDate, formatMoney } from '~/utils/format'

const props = withDefaults(defineProps<{
  data: InventoryMovement[]
  total: number
  loading: boolean
  currency?: string
  supplies?: Supply[]
  products?: Product[]
}>(), {
  currency: 'MXN',
  supplies: () => [],
  products: () => [],
})

const pageCountOptions = [10, 25, 50, 100]
const page = defineModel<number>('page', { default: 1 })
const itemsPerPage = defineModel<number>('pageCount', { default: 10 })

const tipoLabel: Record<InventoryMovement['type'], string> = {
  initial: 'Inicial',
  purchase: 'Compra',
  sale: 'Venta',
  production_input: 'Consumo prod.',
  production_output: 'Producción',
  adjustment_in: 'Ajuste entrada',
  adjustment_out: 'Ajuste salida',
  waste: 'Merma',
  return_in: 'Devolución entrada',
  return_out: 'Devolución salida',
}

const entradas: InventoryMovement['type'][] = [
  'initial',
  'purchase',
  'production_output',
  'adjustment_in',
  'return_in',
]

function esEntrada(m: InventoryMovement): boolean {
  return entradas.includes(m.type)
}

function nombreArticulo(m: InventoryMovement): string {
  if (m.itemType === 'supply') {
    return props.supplies.find(s => s.id === m.supplyId)?.name ?? 'Insumo'
  }
  return props.products.find(p => p.id === m.productId)?.name ?? 'Producto'
}

const totalPaginas = computed(() => Math.ceil((props.total || 0) / itemsPerPage.value) || 1)

watch([itemsPerPage, () => props.total], () => {
  if (page.value > totalPaginas.value) page.value = 1
})

const pageLabel = computed(() => {
  if (!props.total) return 'Mostrando 0 movimientos'
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, props.total)
  return `Mostrando ${start}-${end} de ${props.total} movimientos`
})
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <UCard
      class="border border-default overflow-hidden"
      :ui="{
        header: 'py-3.5 px-5 border-b border-default bg-elevated/60',
        body: 'p-0 overflow-x-auto',
        footer: 'py-3 px-5 border-t border-default bg-elevated/60',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm font-bold text-highlighted tracking-wide">Kardex de inventario</span>
          <UBadge v-if="total" size="sm" color="primary" variant="subtle" class="px-2.5 font-semibold">
            {{ total }} {{ total === 1 ? 'Movimiento' : 'Movimientos' }}
          </UBadge>
        </div>
      </template>

      <table class="w-full text-sm">
        <thead class="bg-elevated/60 text-muted text-xs uppercase tracking-wider sticky top-0">
          <tr>
            <th class="text-left font-semibold px-4 py-2.5">Fecha</th>
            <th class="text-left font-semibold px-4 py-2.5">Artículo</th>
            <th class="text-left font-semibold px-4 py-2.5">Movimiento</th>
            <th class="text-right font-semibold px-4 py-2.5">Cantidad</th>
            <th class="text-right font-semibold px-4 py-2.5">Stock</th>
            <th class="text-right font-semibold px-4 py-2.5">Costo</th>
            <th class="text-left font-semibold px-4 py-2.5">Notas</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-if="loading">
            <td colspan="7" class="px-4 py-8 text-center text-muted">Cargando movimientos...</td>
          </tr>
          <tr v-else-if="!data.length">
            <td colspan="7" class="px-4 py-12">
              <div class="flex flex-col items-center justify-center gap-3">
                <UIcon name="i-lucide-circle-x" class="size-8 text-dimmed" />
                <p class="text-sm text-muted font-medium">No hay movimientos que coincidan con los criterios.</p>
              </div>
            </td>
          </tr>
          <template v-else>
            <tr v-for="m in data" :key="m.id" class="hover:bg-elevated/50 transition-colors duration-150">
              <td class="px-4 py-2.5 text-toned whitespace-nowrap">{{ formatDate(m.date) }}</td>
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-highlighted font-medium truncate max-w-56">{{ nombreArticulo(m) }}</span>
                  <UBadge :color="m.itemType === 'supply' ? 'neutral' : 'primary'" variant="subtle" size="sm" class="shrink-0">
                    {{ m.itemType === 'supply' ? 'Insumo' : 'Producto' }}
                  </UBadge>
                </div>
              </td>
              <td class="px-4 py-2.5">
                <UBadge :color="esEntrada(m) ? 'success' : 'error'" variant="subtle" size="sm" class="font-semibold whitespace-nowrap">
                  {{ tipoLabel[m.type] ?? m.type }}
                </UBadge>
              </td>
              <td class="px-4 py-2.5 text-right whitespace-nowrap font-semibold" :class="esEntrada(m) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                {{ esEntrada(m) ? '+' : '-' }}{{ m.quantity }}
              </td>
              <td class="px-4 py-2.5 text-right text-toned whitespace-nowrap">{{ m.stockBefore }} → {{ m.stockAfter }}</td>
              <td class="px-4 py-2.5 text-right text-toned whitespace-nowrap">
                <div class="flex flex-col items-end">
                  <span>{{ formatMoney(m.totalCost, currency) }}</span>
                  <span class="text-xs text-muted">Unit. {{ formatMoney(m.unitCost, currency) }}</span>
                </div>
              </td>
              <td class="px-4 py-2.5 text-muted truncate max-w-48">{{ m.notes || '—' }}</td>
            </tr>
          </template>
        </tbody>
      </table>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span class="text-muted font-medium">{{ pageLabel }}</span>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-muted">Filas por página:</span>
              <USelect v-model="itemsPerPage" :items="pageCountOptions" size="xs" class="w-16" />
            </div>
            <UPagination
              v-if="total > itemsPerPage || page > 1"
              v-model:page="page"
              :items-per-page="itemsPerPage"
              :total="total"
              size="xs"
            />
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>
