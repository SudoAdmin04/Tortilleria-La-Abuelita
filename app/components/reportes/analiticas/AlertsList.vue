<script setup lang="ts">
import type { AnalyticsAlert } from '~/services/reports.service'
import { formatMoney } from '~/utils/format'

const props = withDefaults(defineProps<{
  data?: AnalyticsAlert[]
  currency?: string
  loading?: boolean
}>(), {
  data: () => [],
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')
</script>

<template>
  <UCard
    class="border border-default overflow-hidden h-full"
    :ui="{ header: 'py-3.5 px-5 border-b border-default bg-elevated/60', body: 'p-4 flex flex-col gap-2' }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="font-display font-semibold">
            Alertas
          </h2>
          <p class="text-sm text-muted">
            Sobregiros y rubros sin presupuesto
          </p>
        </div>
        <UBadge v-if="props.data.length" size="sm" color="warning" variant="subtle" class="px-2.5 font-semibold">
          {{ props.data.length }}
        </UBadge>
      </div>
    </template>
    <template #default>
      <div v-if="props.loading && !props.data.length" class="flex flex-col gap-2">
        <USkeleton v-for="n in 3" :key="n" class="h-16 w-full" />
      </div>
      <div v-else-if="props.data.length" class="flex flex-col gap-2">
        <UAlert
          v-for="a in props.data"
          :key="`${a.categoryId}-${a.title}`"
          :color="a.severity === 'high' ? 'error' : 'warning'"
          variant="subtle"
          :title="a.title"
          :description="`Real ${formatMoney(a.actual, moneda)} vs ppto ${a.budget == null ? '—' : formatMoney(a.budget, moneda)} · Exceso ${formatMoney(a.overspend, moneda)}`"
        />
      </div>
      <p v-else class="text-sm text-muted text-center py-6">
        Sin alertas en el periodo.
      </p>
    </template>
  </UCard>
</template>
