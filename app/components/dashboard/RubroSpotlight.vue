

<script setup lang="ts">
import type { BudgetLine } from '~/types/dashboard'
import { budgetStatusMeta } from '~/utils/budget-status'
import { formatMoney, num } from '~/utils/format'

const props = defineProps<{
  rubros: BudgetLine[]
  currency: string
}>()

const cards = computed(() => [...props.rubros]
  .sort((a, b) => num(b.actual) - num(a.actual))
  .slice(0, 3)
  .map(r => ({
    key: r.categoryId,
    name: r.name,
    color: r.color || '#64748b',
    budget: num(r.budget),
    actual: num(r.actual),
    status: r.status,
    over: (r.status === 'exceeded' || r.status === 'unbudgeted') && num(r.actual) > 0,
    items: (r.items ?? []).map(item => ({
      categoryId: item.categoryId,
      name: item.name,
      budget: num(item.budget),
      actual: num(item.actual),
      exceeded: (item.status === 'exceeded' || item.status === 'unbudgeted') && num(item.actual) > 0,
    })),
  })))
</script>

<template>
  <div v-if="cards.length > 0" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <UCard v-for="card in cards" :key="card.key" class="flex flex-col">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded" :style="{ backgroundColor: card.color }" />
            <h3 class="text-sm font-semibold">
              {{ card.name }}
            </h3>
          </div>
          <span class="text-sm tabular-nums" :class="card.over ? 'text-rose-300 font-semibold' : 'text-emerald-300'">
            Total: {{ formatMoney(card.actual, currency) }}
          </span>
        </div>
      </template>

      <div class="space-y-2.5">
        <div
          v-for="item in card.items"
          :key="item.categoryId"
          class="flex items-center justify-between text-sm rounded-lg px-2 py-1.5 border"
          :class="item.exceeded ? 'bg-rose-400/10 border-rose-400/20' : 'border-transparent'"
        >
          <span class="text-neutral-200 truncate">{{ item.name }}</span>
          <div class="text-right shrink-0 ml-2">
            <span class="tabular-nums font-semibold" :class="item.exceeded ? 'text-rose-300' : ''">
              {{ formatMoney(item.actual, currency) }}
            </span>
            <span class="text-neutral-400 text-xs block tabular-nums">Ppto {{ formatMoney(item.budget, currency) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between text-sm">
          <span class="text-neutral-400">
            Presupuesto: <strong class="text-neutral-100 tabular-nums">{{ formatMoney(card.budget, currency) }}</strong>
          </span>
          <UBadge :color="budgetStatusMeta(card.status).color" variant="soft">
            {{ budgetStatusMeta(card.status).label }}
          </UBadge>
        </div>
      </template>
    </UCard>
  </div>
</template>

