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
  <div v-if="loading && !props.data.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
    <UCard v-for="n in 6" :key="n" class="border border-muted bg-elevated" :ui="{ body: 'p-4' }">
      <div class="flex flex-col gap-2.5 animate-pulse">
        <div class="h-3.5 w-2/3 rounded bg-elevated" />
        <div class="h-2.5 w-1/3 rounded bg-elevated" />
        <div class="h-6 w-1/2 rounded bg-elevated" />
      </div>
    </UCard>
  </div>

  <div v-else-if="!props.data.length" class="flex flex-col items-center justify-center py-10 gap-2.5 rounded-xl border border-dashed border-default bg-elevated/60">
    <UIcon name="i-lucide-wallet" class="size-7 text-dimmed" />
    <p class="text-xs text-muted font-medium">No hay cuentas que coincidan con los criterios.</p>
  </div>

  <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
    <UCard
      v-for="a in props.data"
      :key="a.id"
      class="border border-default  transition-colors duration-200 hover:border-accented"
      :class="a.isActive ? '' : 'opacity-60'"
      :ui="{ body: 'p-4 flex flex-col gap-2' }"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="flex items-center justify-center size-8 rounded-md bg-primary-500/10 text-primary shrink-0">
            <UIcon :name="tipoIcon[a.type]" class="size-4" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted truncate">{{ a.name }}</p>
            <p class="text-[11px] text-muted truncate">
              {{ tipoLabel[a.type] }} · {{ a.institution || '—' }}{{ a.last4 ? ` · •••• ${a.last4}` : '' }}
            </p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1 shrink-0">
          <UBadge v-if="a.isPrimary" color="warning" variant="subtle" size="xs" icon="i-lucide-star">Principal</UBadge>
          <UBadge v-if="!a.isActive" color="neutral" variant="subtle" size="xs">Inactiva</UBadge>
        </div>
      </div>

      <p class="mt-1 text-xl font-bold tracking-tight" :class="(a.balance ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-highlighted'">
        {{ formatMoney(a.balance, mon(a)) }}
      </p>
      <p class="text-[11px] text-dimmed -mt-1">
        Inicial: {{ formatMoney(a.initialBalance, mon(a)) }}{{ a.type === 'credit_card' && a.creditLimit != null ? ` · Límite: ${formatMoney(a.creditLimit, mon(a))}` : '' }}
      </p>

      <div class="mt-1 flex gap-0.5 justify-end border-t border-muted pt-2">
        <UTooltip text="Marcar como principal" :delay-duration="0">
          <UButton
            v-if="puedeEditar && !a.isPrimary && a.isActive"
            size="xs"
            variant="ghost"
            icon="i-lucide-star"
            class="text-dimmed hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 rounded-md"
            aria-label="Marcar como principal"
            @click="emit('setPrimary', a)"
          />
        </UTooltip>
        <UTooltip :text="a.isActive ? 'Desactivar cuenta' : 'Activar cuenta'" :delay-duration="0">
          <UButton
            v-if="puedeEditar"
            size="xs"
            variant="ghost"
            :icon="a.isActive ? 'i-lucide-power' : 'i-lucide-power-off'"
            class="text-dimmed hover:text-highlighted hover:bg-elevated rounded-md"
            :aria-label="a.isActive ? 'Desactivar' : 'Activar'"
            @click="emit('toggleActive', a)"
          />
        </UTooltip>
        <UTooltip text="Editar cuenta" :delay-duration="0">
          <UButton
            v-if="puedeEditar"
            size="xs"
            variant="ghost"
            icon="i-lucide-pencil"
            class="text-dimmed hover:text-highlighted hover:bg-elevated rounded-md"
            aria-label="Editar"
            @click="emit('edit', a)"
          />
        </UTooltip>
        <UTooltip text="Eliminar cuenta" :delay-duration="0">
          <UButton
            v-if="puedeEliminar"
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            aria-label="Eliminar"
            @click="emit('delete', a)"
          />
        </UTooltip>
      </div>
    </UCard>
  </div>
</template>
