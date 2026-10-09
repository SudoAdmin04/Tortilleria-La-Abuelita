<script setup lang="ts">
import type { Account } from '~/services/accounts.service'
import { formatMoney } from '~/utils/format'

const props = defineProps<{
  data: Account[]
  loading: boolean
  currency?: string
  puedeEditar?: boolean
  puedeEliminar?: boolean
}>()

const emit = defineEmits<{
  edit: [cuenta: Account]
  delete: [cuenta: Account]
  toggleActive: [cuenta: Account]
  setPrimary: [cuenta: Account]
}>()

const monedaFallback = computed(() => props.currency || 'MXN')
const mon = (a: Account) => a.currency || monedaFallback.value

const tipoLabel: Record<Account['type'], string> = {
  checking: 'Cheques',
  savings: 'Ahorro',
  cash: 'Efectivo',
  credit_card: 'Tarjeta',
}

const tipoIcon: Record<Account['type'], string> = {
  checking: 'i-lucide-landmark',
  savings: 'i-lucide-piggy-bank',
  cash: 'i-lucide-banknote',
  credit_card: 'i-lucide-credit-card',
}
</script>

<template>
  <div v-if="loading && !props.data.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    <UCard v-for="n in 6" :key="n" class="border border-white/10">
      <div class="flex flex-col gap-3 animate-pulse">
        <div class="h-4 w-2/3 rounded bg-white/10" />
        <div class="h-3 w-1/3 rounded bg-white/10" />
        <div class="h-8 w-1/2 rounded bg-white/10" />
      </div>
    </UCard>
  </div>

  <div v-else-if="!props.data.length" class="flex flex-col items-center justify-center py-12 gap-3">
    <UIcon name="i-lucide-wallet" class="size-8 text-white/30" />
    <p class="text-sm text-white/50 font-medium">No hay cuentas que coincidan con los criterios.</p>
  </div>

  <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    <UCard
      v-for="a in props.data"
      :key="a.id"
      class="border border-white/10"
      :class="a.isActive ? '' : 'opacity-60'"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-500 shrink-0">
            <UIcon :name="tipoIcon[a.type]" class="size-5" />
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-white truncate">{{ a.name }}</p>
            <p class="text-xs text-slate-400 truncate">
              {{ tipoLabel[a.type] }} · {{ a.institution || '—' }}{{ a.last4 ? ` · •••• ${a.last4}` : '' }}
            </p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1 shrink-0">
          <UBadge v-if="a.isPrimary" color="primary" variant="subtle" size="sm">Principal</UBadge>
          <UBadge v-if="!a.isActive" color="neutral" variant="subtle" size="sm">Inactiva</UBadge>
        </div>
      </div>

      <p class="mt-3 text-2xl font-bold" :class="(a.balance ?? 0) < 0 ? 'text-red-400' : 'text-white'">
        {{ formatMoney(a.balance, mon(a)) }}
      </p>
      <p class="text-xs text-white/40">
        Inicial: {{ formatMoney(a.initialBalance, mon(a)) }}{{ a.type === 'credit_card' && a.creditLimit != null ? ` · Límite: ${formatMoney(a.creditLimit, mon(a))}` : '' }}
      </p>

      <div class="mt-3 flex gap-1 justify-end">
        <UButton
          v-if="puedeEditar && !a.isPrimary && a.isActive"
          size="xs"
          variant="ghost"
          icon="i-lucide-star"
          class="text-white/40 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"
          aria-label="Marcar como principal"
          @click="emit('setPrimary', a)"
        />
        <UButton
          v-if="puedeEditar"
          size="xs"
          variant="ghost"
          :icon="a.isActive ? 'i-lucide-power' : 'i-lucide-power-off'"
          class="text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
          :aria-label="a.isActive ? 'Desactivar' : 'Activar'"
          @click="emit('toggleActive', a)"
        />
        <UButton
          v-if="puedeEditar"
          size="xs"
          variant="ghost"
          icon="i-lucide-pencil"
          class="text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
          aria-label="Editar"
          @click="emit('edit', a)"
        />
        <UButton
          v-if="puedeEliminar"
          size="xs"
          variant="ghost"
          color="error"
          icon="i-lucide-trash-2"
          aria-label="Eliminar"
          @click="emit('delete', a)"
        />
      </div>
    </UCard>
  </div>
</template>
