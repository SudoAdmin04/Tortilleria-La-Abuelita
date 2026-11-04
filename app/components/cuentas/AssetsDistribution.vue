<script setup lang="ts">
import type { AssetsDistribution } from '~/services/accounts.service'
import { formatMoney } from '~/utils/format'

const props = withDefaults(defineProps<{
  data: AssetsDistribution | null
  loading?: boolean
  currency?: string
}>(), {
  loading: false,
  currency: 'MXN',
})

const moneda = computed(() => props.currency || 'MXN')

const dotColor: Record<string, string> = {
  checking: 'bg-indigo-300',
  savings: 'bg-emerald-400',
  cash: 'bg-slate-400',
  credit_card: 'bg-red-400',
}

const barColor: Record<string, string> = {
  checking: 'bg-indigo-300',
  savings: 'bg-emerald-400',
  cash: 'bg-slate-400',
  credit_card: 'bg-red-400',
}

const pctColor: Record<string, string> = {
  checking: 'text-indigo-600 dark:text-indigo-300',
  savings: 'text-emerald-600 dark:text-emerald-400',
  cash: 'text-muted',
  credit_card: 'text-red-600 dark:text-red-400',
}

const dotOf = (key: string) => dotColor[key] ?? 'bg-primary-400'
const barOf = (key: string) => barColor[key] ?? 'bg-primary-400'
const pctOf = (key: string) => pctColor[key] ?? 'text-primary'
const widthOf = (p: number) => `${Math.min(100, Math.max(0, Math.round(p ?? 0)))}%`
</script>

<template>
  <UCard
    class="border border-default"
    :ui="{ body: 'p-4 sm:p-5 flex flex-col gap-4' }"
  >
    <div class="flex items-start justify-between gap-3">
      <h3 class="text-base font-bold text-highlighted tracking-tight">Distribución de Activos</h3>
      <span class="text-xs text-muted font-medium shrink-0 pt-0.5">Porcentaje</span>
    </div>

    <template v-if="loading && !data">
      <div class="flex flex-col gap-3 animate-pulse">
        <div class="h-2 rounded-full bg-elevated" />
        <div class="h-3 w-2/3 mx-auto rounded bg-elevated" />
        <div v-for="n in 3" :key="n" class="h-14 rounded-lg bg-elevated" />
      </div>
    </template>

    <template v-else-if="data && data.items.length">
      <div>
        <div class="flex h-2 rounded-full overflow-hidden bg-elevated">
          <div
            v-for="g in data.items"
            :key="g.key"
            class="h-full"
            :class="barOf(g.key)"
            :style="{ width: widthOf(g.percent) }"
          />
        </div>
        <div class="mt-1.5 flex items-center justify-between text-xs text-muted font-medium">
          <span class="tabular-nums">0%</span>
          <span class="truncate">Total Activos: {{ formatMoney(data.totalActivos, moneda) }}</span>
          <span class="tabular-nums">100%</span>
        </div>
      </div>

      <div class="flex flex-col gap-2.5">
        <div
          v-for="g in data.items"
          :key="g.key"
          class="flex items-center justify-between gap-3 rounded-lg border border-muted bg-elevated/60 px-3.5 py-3"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="size-2 rounded-full shrink-0" :class="dotOf(g.key)" />
            <div class="min-w-0">
              <p class="text-sm text-toned font-medium truncate">{{ g.label }}</p>
              <p v-if="g.count > 1" class="text-[11px] text-dimmed">{{ g.count }} cuentas</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="text-base font-bold text-highlighted tabular-nums">{{ formatMoney(g.balance, moneda) }}</p>
            <p class="text-xs font-semibold tabular-nums" :class="pctOf(g.key)">{{ Math.round(g.percent) }}%</p>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-dashed border-default bg-elevated/60">
      <UIcon name="i-lucide-chart-pie" class="size-6 text-dimmed" />
      <p class="text-xs text-muted font-medium">Sin distribución para mostrar.</p>
    </div>
  </UCard>
</template>
