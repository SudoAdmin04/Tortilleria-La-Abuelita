<script setup lang="ts">
import type { DebtsSnapshot } from '~/services/dashboard.service'
import { formatDate, formatMoney, num } from '~/utils/format'

interface DebtItem {
  id?: string
  name?: string
  outstanding?: number
  dueDate?: string | null
  status?: string
}

const props = withDefaults(defineProps<{
  data?: DebtsSnapshot | null
  currency?: string
  loading?: boolean
}>(), {
  data: null,
  currency: 'MXN',
  loading: false,
})

const moneda = computed(() => props.currency || 'MXN')
const payable = computed(() => num(props.data?.payable))
const receivable = computed(() => num(props.data?.receivable))
const items = computed<DebtItem[]>(() => (Array.isArray(props.data?.items) ? (props.data!.items as DebtItem[]) : []))
const hero = computed<DebtItem | null>(() => items.value[0] ?? null)
const amortized = computed(() => num(props.data?.amortizedInRange))
const topMethod = computed(() => props.data?.topMethod ?? null)
const pending = computed(() => payable.value > 0)
</script>

<template>
  <UCard class="border border-white/10 hover:border-white/15 flex flex-col">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h3 class="font-display font-semibold">
            Deudas & Pasivos
          </h3>
        </div>
        <UBadge :color="pending ? 'warning' : 'success'" variant="soft">
          {{ pending ? 'Pendiente' : 'Al día' }}
        </UBadge>
      </div>
    </template>

    <div v-if="loading && !data" class="flex flex-col gap-3 animate-pulse">
      <div class="h-4 w-2/3 rounded bg-white/10" />
      <div class="h-3 w-full rounded bg-white/10" />
      <div class="h-3 w-1/2 rounded bg-white/10" />
    </div>

    <div v-else-if="!hero && payable === 0 && receivable === 0" class="py-8">
      <UEmpty icon="i-lucide-hand-coins" title="Sin pasivos vigentes" description="No hay deudas por pagar ni por cobrar en el rango." />
    </div>

    <div v-else class="flex flex-col gap-3">
      <div v-if="hero" class="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
        <div class="flex items-start justify-between gap-2">
          <span class="font-semibold text-neutral-100">{{ hero.name ?? 'Deuda' }}</span>
          <span class="font-display font-bold text-lg tabular-nums text-rose-300 shrink-0">{{ formatMoney(hero.outstanding, moneda) }}</span>
        </div>
        <p class="text-xs text-neutral-400 mt-1">
          Saldo vivo por liquidar{{ hero.dueDate ? ` · vence ${formatDate(hero.dueDate)}` : '' }}
        </p>
        <div class="flex items-center justify-between text-xs mt-3 pt-2 border-t border-white/5">
          <span class="text-neutral-400">Por cobrar</span>
          <span class="tabular-nums font-semibold text-green-300">{{ formatMoney(receivable, moneda) }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs">
        <span class="text-neutral-400">Método Utilizado</span>
        <span class="font-medium text-blue-300 truncate ml-2">{{ topMethod ?? '—' }}</span>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between text-xs gap-2">
        <span class="text-neutral-400 shrink-0">Total Amortizado</span>
        <span class="tabular-nums font-bold text-rose-300">{{ formatMoney(amortized, moneda) }}</span>
      </div>
    </template>
  </UCard>
</template>
