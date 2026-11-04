<script setup lang="ts">
import type { DistributionItem } from '~/composables/useReportes'
import { formatMoney, num } from '~/utils/format'

const props = withDefaults(defineProps<{
  data?: DistributionItem[]
  currency?: string
  loading?: boolean
}>(), {
  data: () => [],
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')

const CIRCUMFERENCE = 2 * Math.PI * 38
const FALLBACK_COLORS = ['#4d8eff', '#4edea3', '#ff516a', '#adc6ff', '#fbbf24', '#c084fc']

const total = computed(() => props.data.reduce((s, i) => s + num(i.amount), 0))

const segments = computed(() => {
  let offset = 0
  return props.data.map((item, i) => {
    const percent = num(item.percent)
    const length = (percent / 100) * CIRCUMFERENCE
    const seg = {
      key: item.categoryId || item.name,
      name: item.name,
      percent: percent.toLocaleString('es-MX', { maximumFractionDigits: 1 }),
      amount: num(item.amount),
      color: item.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]!,
      length,
      offset,
    }
    offset += length
    return seg
  })
})
</script>

<template>
  <UCard class="border border-default hover:border-accented">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div>
          <h2 class="font-display font-semibold">
            Distribución de gastos
          </h2>
          <p class="text-sm text-muted">
            Participación por rubro del mes
          </p>
        </div>
        <UIcon name="i-lucide-chart-pie" class="size-5 text-muted" />
      </div>
    </template>

    <div v-if="loading && segments.length === 0" class="flex flex-col items-center gap-4 py-6 animate-pulse">
      <div class="size-48 rounded-full bg-elevated ring-8 ring-default" />
      <div class="grid grid-cols-2 gap-2 w-full">
        <div v-for="n in 4" :key="n" class="h-8 rounded bg-elevated" />
      </div>
    </div>

    <div v-else-if="segments.length === 0" class="py-8">
      <UEmpty icon="i-lucide-chart-pie" title="Sin gastos en el periodo" description="Aún no hay movimientos en este mes." />
    </div>

    <template v-else>
      <div class="relative flex items-center justify-center my-4">
        <svg class="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--ui-bg-accented)" :stroke-width="12" />
          <circle
            v-for="seg in segments"
            :key="seg.key"
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            :stroke="seg.color"
            :stroke-dasharray="`${seg.length} ${CIRCUMFERENCE - seg.length}`"
            :stroke-dashoffset="-seg.offset"
            :stroke-width="12"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span class="text-sm text-muted">Total egresos</span>
          <span class="font-display font-bold text-lg tabular-nums">{{ formatMoney(total, moneda) }}</span>
          <span class="text-xs text-muted">100%</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-3 border-t border-muted text-sm">
        <div v-for="seg in segments" :key="seg.key" class="flex items-center gap-2 min-w-0">
          <span class="w-3 h-3 rounded shrink-0" :style="{ backgroundColor: seg.color }" />
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-medium truncate">{{ seg.name }} ({{ seg.percent }}%)</span>
            <span class="text-muted tabular-nums text-xs">{{ formatMoney(seg.amount, moneda) }}</span>
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>
