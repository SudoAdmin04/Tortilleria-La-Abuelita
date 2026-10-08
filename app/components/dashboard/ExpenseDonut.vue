
<script setup lang="ts">
import type { DistributionItem } from '~/types/dashboard'
import { formatMoney } from '~/utils/format'

const props = defineProps<{
  distribution: DistributionItem[]
  total: number
  currency: string
}>()

const CIRCUMFERENCE = 2 * Math.PI * 38
const FALLBACK_COLORS = ['#4d8eff', '#4edea3', '#ff516a', '#adc6ff', '#fbbf24', '#c084fc']

const segments = computed(() => {
  let offset = 0
  return props.distribution.map((item, i) => {
    const percent = typeof item.percent === 'number' ? item.percent : 0
    const length = (percent / 100) * CIRCUMFERENCE
    const seg = {
      key: item.categoryId || item.name,
      name: item.name,
      percent: percent.toLocaleString('es-MX', { maximumFractionDigits: 1 }),
      amount: item.amount,
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
  <UCard >
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display font-semibold">
            Distribución de Gastos
          </h2>
          <p class="text-sm text-neutral-400">
            Participación porcentual del gasto total
          </p>
        </div>
        <UIcon name="i-lucide-chart-pie" class="size-5 text-neutral-400" />
      </div>
    </template>

    <div v-if="segments.length === 0" class="py-8">
      <UEmpty icon="i-lucide-chart-pie" title="Sin gastos este mes" description="Aún no hay movimientos registrados en el periodo." />
    </div>

    <template v-else>
      <div class="relative flex items-center justify-center my-4">
        <svg class="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1c1f29" :stroke-width="12" />
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
          <span class="text-sm text-neutral-400">Total Egresos</span>
          <span class="font-display font-bold text-lg">{{ formatMoney(total, currency) }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-sm">
        <div v-for="seg in segments" :key="seg.key" class="flex items-center gap-2">
          <span class="w-3 h-3 rounded shrink-0" :style="{ backgroundColor: seg.color }" />
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-medium truncate">{{ seg.name }} ({{ seg.percent }}%)</span>
            <span class="text-neutral-400 tabular-nums text-xs">{{ formatMoney(seg.amount, currency) }}</span>
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>

