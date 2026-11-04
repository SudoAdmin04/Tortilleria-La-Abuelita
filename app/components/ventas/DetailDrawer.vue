<script setup lang="ts">
import type { Sale } from '~/services/sales.service'
import { formatDate, formatMoney } from '~/utils/format'

const open = defineModel<boolean>('open', { default: false })
const props = withDefaults(defineProps<{
  venta?: Sale | null
  currency?: string
}>(), {
  venta: null,
  currency: 'MXN',
})

const metodosPagoLabel: Record<string, string> = {
  cash: 'Efectivo',
  debit_card: 'Tarjeta de débito',
  credit_card: 'Tarjeta de crédito',
  bank_transfer: 'Transferencia',
}

const metodoPago = computed(() => props.venta?.paymentMethod
  ? (metodosPagoLabel[props.venta.paymentMethod] ?? props.venta.paymentMethod)
  : 'No especificado')

const completada = computed(() => props.venta?.status === 'completed')
</script>

<template>
  <UDrawer direction="right" v-model:open="open" :dismissible="false" :handle="false">
    <template #content>
      <div class="flex flex-col w-150 h-full">
        <div class="bg-elevated/60 p-6 pb-4 flex flex-col gap-4 shrink-0 border-b border-default">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary shrink-0">
                <UIcon name="i-lucide-receipt" class="size-6" />
              </div>
              <div class="min-w-0">
                <h3 class="text-lg font-semibold text-highlighted truncate">
                  {{ venta?.customerName || 'Mostrador' }}
                </h3>
                <p class="text-xs text-muted">
                  {{ venta ? formatDate(venta.date) : 'Sin información' }} · {{ venta?.items?.length ?? 0 }} producto(s)
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>

          <div class="flex items-center gap-2">
            <UBadge :color="completada ? 'success' : 'neutral'" variant="subtle" size="sm" class="font-semibold">
              {{ completada ? 'Completada' : 'Cancelada' }}
            </UBadge>
            <UBadge color="neutral" variant="subtle" size="sm" class="font-semibold">
              {{ venta?.accountName || 'Sin cuenta' }}
            </UBadge>
            <UBadge color="neutral" variant="subtle" size="sm" class="font-semibold">
              {{ metodoPago }}
            </UBadge>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div class="rounded-xl border border-default bg-elevated/60 p-4 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Subtotal</span>
              <span class="text-highlighted">{{ formatMoney(venta?.subtotal, currency) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Descuento</span>
              <span class="text-highlighted">-{{ formatMoney(venta?.discount, currency) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Costo de producción</span>
              <span class="text-highlighted">{{ formatMoney(venta?.totalCost, currency) }}</span>
            </div>
            <div class="flex items-center justify-between border-t border-default pt-2">
              <span class="text-xs uppercase tracking-widest text-muted">Total</span>
              <span class="text-lg font-bold text-highlighted">{{ formatMoney(venta?.total, currency) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Utilidad bruta</span>
              <span :class="(venta?.grossProfit ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'">
                {{ formatMoney(venta?.grossProfit, currency) }}
              </span>
            </div>
          </div>

          <div class="space-y-3">
            <span class="text-sm font-bold text-highlighted">Productos</span>
            <div class="rounded-xl border border-default overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-elevated/60 text-muted text-xs uppercase tracking-wider">
                  <tr>
                    <th class="text-left font-semibold px-3 py-2">Producto</th>
                    <th class="text-right font-semibold px-3 py-2">Cantidad</th>
                    <th class="text-right font-semibold px-3 py-2">Precio</th>
                    <th class="text-right font-semibold px-3 py-2">Importe</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-default">
                  <tr v-for="item in venta?.items ?? []" :key="item.id">
                    <td class="px-3 py-2.5">
                      <div class="flex flex-col min-w-0">
                        <span class="text-highlighted font-medium truncate">{{ item.productName }}</span>
                        <span class="text-xs text-muted">Costo {{ formatMoney(item.unitCost, currency) }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2.5 text-right text-toned whitespace-nowrap">{{ item.quantity }}</td>
                    <td class="px-3 py-2.5 text-right text-toned whitespace-nowrap">{{ formatMoney(item.unitPrice, currency) }}</td>
                    <td class="px-3 py-2.5 text-right text-highlighted font-semibold whitespace-nowrap">{{ formatMoney(item.lineTotal, currency) }}</td>
                  </tr>
                  <tr v-if="!venta?.items?.length">
                    <td colspan="4" class="px-3 py-6 text-center text-muted">Sin productos registrados.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="venta?.notes" class="space-y-2">
            <span class="text-sm font-bold text-highlighted">Notas</span>
            <p class="text-sm text-toned rounded-xl border border-default bg-elevated/60 p-3">{{ venta.notes }}</p>
          </div>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton type="button" color="neutral" variant="outline" label="Cerrar" @click="() => { open = false }" />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
