<script setup lang="ts">
import type { SavingsSnapshot } from '~/services/dashboard.service'
import { formatExecution, formatMoney, num } from '~/utils/format'

interface GoalItem {
  goalId?: string
  name?: string
  contributed?: number
  monthlyTarget?: number
  percent?: number
}

interface PayMethodItem {
  method?: string
  label?: string
  total?: number
  count?: number
}

const props = withDefaults(defineProps<{
  data?: SavingsSnapshot | null
  currency?: string
  loading?: boolean
}>(), {
  data: null,
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')
const goals = computed<GoalItem[]>(() => (Array.isArray(props.data?.goals) ? (props.data!.goals as GoalItem[]) : []))
const methods = computed<PayMethodItem[]>(() => (Array.isArray(props.data?.paymentMethods) ? (props.data!.paymentMethods as PayMethodItem[]) : []))
const hero = computed<GoalItem | null>(() => goals.value[0] ?? null)
const totalSaved = computed(() => num(props.data?.totalSaved))
const totalTarget = computed(() => num(props.data?.totalTarget))
const heroPct = computed(() => Math.min(100, Math.max(0, num(hero.value?.percent))))
const done = computed(() => totalTarget.value > 0 && totalSaved.value >= totalTarget.value)
</script>

<template>
  <UCard class="border border-white/10 hover:border-white/15 flex flex-col">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h3 class="font-display font-semibold">
            Ahorro Semanal & Metas
          </h3>
        </div>
        <UBadge :color="done ? 'success' : 'info'" variant="soft">
          {{ done ? 'Cumplido' : 'En curso' }}
        </UBadge>
      </div>
    </template>

    <div v-if="loading && !data" class="flex flex-col gap-3 animate-pulse">
      <div class="h-4 w-2/3 rounded bg-white/10" />
      <div class="h-2 rounded-full bg-white/10" />
      <div class="h-3 w-1/2 rounded bg-white/10" />
    </div>

    <div v-else-if="!hero && totalSaved === 0" class="py-8">
      <UEmpty icon="i-lucide-piggy-bank" title="Sin ahorro en el periodo" description="Aún no hay aportes a metas en el rango." />
    </div>

    <div v-else class="flex flex-col gap-3">
      <div>
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-neutral-100 truncate">{{ hero?.name ?? 'Ahorro' }}</span>
          <span class="font-display font-bold text-lg tabular-nums text-green-300 shrink-0">{{ formatMoney(hero?.contributed ?? totalSaved, moneda) }}</span>
        </div>
        <UProgress :model-value="heroPct" :max="100" color="success" class="mt-2" />
        <div class="flex items-center justify-between text-xs text-neutral-400 mt-1.5">
          <span>Presupuesto: {{ formatMoney(hero?.monthlyTarget ?? totalTarget, moneda) }}</span>
          <span class="font-medium text-green-300">{{ formatExecution(hero?.percent) }} depositado</span>
        </div>
      </div>

      <div v-if="methods.length > 0">
        <p class="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-2">
          Métodos de pago vinculados
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="m in methods.slice(0, 4)"
            :key="m.method ?? m.label"
            color="neutral"
            variant="soft"
            class="font-medium"
          >
            {{ m.label ?? m.method }}
          </UBadge>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between text-xs gap-2">
        <span class="text-neutral-400 shrink-0">Reserva acumulada</span>
        <span class="tabular-nums font-bold text-green-300">{{ formatMoney(totalSaved, moneda) }} / mes</span>
      </div>
    </template>
  </UCard>
</template>
