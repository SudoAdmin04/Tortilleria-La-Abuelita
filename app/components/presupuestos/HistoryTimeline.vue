<script setup lang="ts">
import type { BudgetAdjustment } from '~/services/budgets.service'
import { formatMoney, formatDate } from '~/utils/format'

const props = withDefaults(defineProps<{
  items: BudgetAdjustment[]
  loading?: boolean
  currency?: string
}>(), { loading: false, currency: 'MXN' })
</script>

<template>
  <UCard class="border border-default" :ui="{ header: 'py-3.5 px-5 border-b border-default bg-elevated/60', body: 'p-5' }">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-sm font-bold text-highlighted tracking-wide">Historial de ajustes</span>
        <UBadge size="sm" color="neutral" variant="subtle">{{ props.items.length }}</UBadge>
      </div>
    </template>
    <template #default>
      <div v-if="props.loading" class="flex flex-col gap-3">
        <USkeleton v-for="i in 3" :key="i" class="h-14 w-full" />
      </div>
      <div v-else-if="!props.items.length" class="flex flex-col items-center py-8 gap-2">
        <UIcon name="i-lucide-history" class="size-8 text-dimmed" />
        <p class="text-sm text-muted">Sin ajustes registrados para este presupuesto.</p>
      </div>
      <ol v-else class="relative flex flex-col gap-4 border-l border-default pl-5">
        <li v-for="a in props.items" :key="a.id" class="relative">
          <span class="absolute -left-[27px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-semibold text-highlighted">{{ formatMoney(a.previousAmount, props.currency) }}</span>
            <UIcon name="i-lucide-move-right" class="size-4 text-muted" />
            <span class="text-sm font-semibold text-primary">{{ formatMoney(a.newAmount, props.currency) }}</span>
            <UBadge size="xs" :color="a.source === 'manual' ? 'primary' : 'neutral'" variant="subtle">{{ a.source }}</UBadge>
          </div>
          <p v-if="a.reason" class="text-xs text-muted mt-1">{{ a.reason }}</p>
          <p class="text-[11px] text-muted mt-0.5">{{ formatDate(String(a.createdAt)) }}</p>
        </li>
      </ol>
    </template>
  </UCard>
</template>
