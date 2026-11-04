<script setup lang="ts">
import type { CategoryBreakdown } from '~/services/dashboard.service'
import { formatMoney, formatVariance, num } from '~/utils/format'

const props = withDefaults(defineProps<{
  data?: CategoryBreakdown | null
  currency?: string
  loading?: boolean
}>(), {
  data: null,
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')
const items = computed(() => props.data?.items ?? [])
const rubroName = computed(() => {
  const rubro = (props.data?.rubro ?? {}) as Record<string, unknown>
  return typeof rubro.name === 'string' && rubro.name ? rubro.name : 'Servicios'
})
const totalActual = computed(() => num(props.data?.totalActual))
const totalBudget = computed(() => num(props.data?.totalBudget))
</script>

<template>
  <UCard class="border border-default hover:border-accented flex flex-col">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h3 class="font-display font-semibold">
            {{ rubroName }}
          </h3>
        </div>
        <span class="text-xs font-semibold text-green-600 dark:text-green-300 tabular-nums">Total: {{ formatMoney(totalActual, moneda) }}</span>
      </div>
    </template>

    <div v-if="loading && items.length === 0" class="flex flex-col gap-2 animate-pulse">
      <div v-for="n in 5" :key="n" class="flex items-center justify-between rounded-lg px-2 py-2">
        <div class="h-3 w-28 rounded bg-elevated" />
        <div class="h-3 w-20 rounded bg-elevated" />
      </div>
    </div>

    <div v-else-if="items.length === 0" class="py-8">
      <UEmpty icon="i-lucide-receipt" title="Sin partidas en el periodo" description="El rubro no tiene movimientos en el rango." />
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="item in items"
        :key="item.categoryId"
        class="flex items-center justify-between text-sm rounded-lg px-2.5 py-2 border"
        :class="(item.status === 'exceeded' || item.status === 'unbudgeted') ? 'bg-rose-400/10 border-rose-400/20' : 'border-transparent hover:border-default'"
      >
        <span class="flex items-center gap-2 text-toned truncate min-w-0">
          <UIcon v-if="item.icon" :name="`i-lucide-${item.icon}`" class="size-4 shrink-0 text-muted" />
          <span class="truncate">{{ item.name }}</span>
        </span>
        <div class="text-right shrink-0 ml-2">
          <span class="tabular-nums font-semibold" :class="(item.status === 'exceeded' || item.status === 'unbudgeted') ? 'text-rose-600 dark:text-rose-300' : 'text-green-600 dark:text-green-300'">
            {{ formatMoney(item.actual, moneda) }}
          </span>
          <span class="text-muted text-xs block tabular-nums">
            Ppto {{ formatMoney(item.budget, moneda) }} · {{ item.badge }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between text-xs gap-2">
        <span class="text-muted truncate">
          Presupuesto: <strong class="text-highlighted tabular-nums">{{ formatMoney(totalBudget, moneda) }}</strong>
        </span>
        <span class="font-semibold shrink-0" :class="totalActual > totalBudget ? 'text-rose-600 dark:text-rose-300' : 'text-green-600 dark:text-green-300'">
          {{ data?.footer ?? formatVariance(totalActual - totalBudget, moneda) }}
        </span>
      </div>
    </template>
  </UCard>
</template>
