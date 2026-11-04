<script setup lang="ts">
import type { Production } from '~/services/production.service'
import { formatDate, formatMoney } from '~/utils/format'

const open = defineModel<boolean>('open', { default: false })
const props = withDefaults(defineProps<{
  lote?: Production | null
  currency?: string
}>(), {
  lote: null,
  currency: 'MXN',
})

const { detalle, loadingDetalle, fetchById } = useProduccion()

watch(open, async (isOpen) => {
  if (!isOpen || !props.lote) return
  await fetchById(props.lote.id)
})

const registro = computed(() => detalle.value ?? props.lote)
const completado = computed(() => registro.value?.status === 'completed')
</script>

<template>
  <UDrawer direction="right" v-model:open="open" :dismissible="false" :handle="false">
    <template #content>
      <div class="flex flex-col w-150 h-full">
        <div class="bg-elevated/60 p-6 pb-4 flex flex-col gap-4 shrink-0 border-b border-default">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary shrink-0">
                <UIcon name="i-lucide-factory" class="size-6" />
              </div>
              <div class="min-w-0">
                <h3 class="text-lg font-semibold text-highlighted truncate">
                  {{ registro?.productName || 'Detalle del lote' }}
                </h3>
                <p class="text-xs text-muted">
                  {{ registro ? formatDate(registro.date) : 'Sin información' }} · {{ registro?.quantity ?? 0 }} unidades
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>

          <div class="flex items-center gap-2">
            <UBadge :color="completado ? 'success' : 'neutral'" variant="subtle" size="sm" class="font-semibold">
              {{ completado ? 'Completado' : 'Cancelado' }}
            </UBadge>
            <UBadge color="neutral" variant="subtle" size="sm" class="font-semibold">
              Costo unitario {{ formatMoney(registro?.unitCost, currency) }}
            </UBadge>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div class="rounded-xl border border-default bg-elevated/60 p-4 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Cantidad producida</span>
              <span class="text-highlighted">{{ registro?.quantity ?? 0 }}</span>
            </div>
            <div class="flex items-center justify-between border-t border-default pt-2">
              <span class="text-xs uppercase tracking-widest text-muted">Costo total</span>
              <span class="text-lg font-bold text-highlighted">{{ formatMoney(registro?.totalCost, currency) }}</span>
            </div>
          </div>

          <div class="space-y-3">
            <span class="text-sm font-bold text-highlighted">Insumos consumidos</span>

            <div v-if="loadingDetalle" class="flex flex-col gap-2 animate-pulse">
              <div v-for="n in 3" :key="n" class="h-10 rounded-lg bg-elevated" />
            </div>

            <div v-else class="rounded-xl border border-default overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-elevated/60 text-muted text-xs uppercase tracking-wider">
                  <tr>
                    <th class="text-left font-semibold px-3 py-2">Insumo</th>
                    <th class="text-right font-semibold px-3 py-2">Cantidad</th>
                    <th class="text-right font-semibold px-3 py-2">Costo</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-default">
                  <tr v-for="item in registro?.inputs ?? []" :key="item.supplyId">
                    <td class="px-3 py-2.5 text-highlighted">{{ item.supplyName }}</td>
                    <td class="px-3 py-2.5 text-right text-toned whitespace-nowrap">{{ item.quantity }} {{ item.supplyUnit }}</td>
                    <td class="px-3 py-2.5 text-right text-toned whitespace-nowrap">{{ formatMoney(item.totalCost, currency) }}</td>
                  </tr>
                  <tr v-if="!registro?.inputs?.length">
                    <td colspan="3" class="px-3 py-6 text-center text-muted">Sin insumos registrados.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="registro?.notes" class="space-y-2">
            <span class="text-sm font-bold text-highlighted">Notas</span>
            <p class="text-sm text-toned rounded-xl border border-default bg-elevated/60 p-3">{{ registro.notes }}</p>
          </div>
        </div>

        <div class="bg-elevated/60 flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-default">
          <UButton type="button" color="neutral" variant="outline" label="Cerrar" @click="() => { open = false }" />
        </div>
      </div>
    </template>
  </UDrawer>
</template>
