<script setup lang="ts">
import type { IncomeSources } from '~/services/transactions.service'
import { formatExecution, formatMoney, num } from '~/utils/format'

const props = withDefaults(defineProps<{
  data?: IncomeSources | null
  currency?: string
  loading?: boolean
}>(), {
  data: null,
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')
const FALLBACK = ['#34d399', '#5b8def', '#2dd4bf', '#a78bfa', '#fbbf24', '#f4a7b9']

const items = computed(() => props.data?.items ?? [])
const total = computed(() => num(props.data?.total))
const compliance = computed(() => props.data?.complianceRate ?? null)

function colorOf(index: number): string {
  return items.value[index]?.color || FALLBACK[index % FALLBACK.length]!
}

function barWidth(actual: number, budget: number): number {
  const a = num(actual)
  const b = num(budget)
  if (b <= 0) return a > 0 ? 100 : 0
  return Math.max(0, Math.min(100, (a / b) * 100))
}
</script>

<template>
  <UCard
    class="border border-default overflow-hidden"
    :ui="{
      header: 'py-4 px-5 border-b border-default bg-elevated/60',
      body: 'p-5 flex flex-col gap-4',
      footer: 'py-3 px-5 border-t border-default bg-elevated/60',
    }"
  >
    <template #header>
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-col gap-1 min-w-0">
          <span class="text-[15px] font-bold text-highlighted tracking-tight">Fuentes de Ingreso</span>
          <span class="text-xs text-muted">Entradas efectivas contra metas presupuestadas.</span>
        </div>
        <span class="text-xs font-semibold text-emerald-600/90 dark:text-emerald-300/90 tabular-nums shrink-0 pt-0.5">
          Total: {{ formatMoney(total, moneda) }}
        </span>
      </div>
    </template>

    <template v-if="loading && items.length === 0">
      <div class="flex flex-col gap-4 animate-pulse">
        <div v-for="n in 3" :key="n" class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="h-3 w-32 rounded bg-elevated" />
            <div class="h-3 w-28 rounded bg-elevated" />
          </div>
          <div class="h-1.5 rounded-full bg-elevated" />
        </div>
      </div>
    </template>

    <template v-else-if="items.length === 0">
      <div class="flex flex-col items-center justify-center py-8 gap-2">
        <UIcon name="i-lucide-wallet" class="size-7 text-dimmed" />
        <p class="text-sm text-muted font-medium">Sin ingresos en la vista actual.</p>
      </div>
    </template>

    <template v-else>
      <ul class="flex flex-col gap-4">
        <li v-for="(it, i) in items" :key="it.categoryId || it.name" class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-3 text-sm">
            <span class="text-toned font-medium truncate">{{ it.name }}</span>
            <span class="text-emerald-600/90 dark:text-emerald-300/90 font-semibold tabular-nums shrink-0 text-[13px]">
              +{{ formatMoney(it.actual, moneda) }} / {{ formatMoney(it.budget, moneda) }}
            </span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-elevated ring-1 ring-default">
            <div
              class="h-full rounded-full transition-all duration-300"
              :style="{ width: `${barWidth(it.actual, it.budget)}%`, backgroundColor: colorOf(i) }"
            />
          </div>
        </li>
      </ul>
    </template>

    <template #footer>
      <div class="flex items-center justify-between gap-3 text-xs">
        <span class="text-muted truncate">Cumplimiento total ingresos</span>
        <span class="font-bold tabular-nums shrink-0 text-emerald-600/90 dark:text-emerald-300/90">
          {{ compliance == null ? '—' : formatExecution(compliance) }}
        </span>
      </div>
    </template>
  </UCard>
</template>
