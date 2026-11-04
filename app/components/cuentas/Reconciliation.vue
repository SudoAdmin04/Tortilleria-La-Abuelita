<script setup lang="ts">
import type { Reconciliation } from '~/services/accounts.service'

const props = withDefaults(defineProps<{
  data: Reconciliation | null
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  import: []
}>()

const rate = computed(() => Math.min(100, Math.max(0, Math.round(props.data?.completionRate ?? 0))))

const pendienteDestacado = computed(() => props.data?.recentPending?.[0] ?? null)

const pendienteTexto = computed(() => {
  const p = pendienteDestacado.value
  if (!p) return null
  const n = props.data?.pendingCount ?? 1
  const plural = n === 1 ? 'movimiento por conciliar' : 'movimientos por conciliar'
  const ref = p.debtReference ? ` ${p.debtReference}` : ''
  return `${n} ${plural} en ${p.accountName}${ref}`
})
</script>

<template>
  <UCard
    class="border border-default"
    :ui="{ body: 'p-4 sm:p-5 flex flex-col gap-4' }"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <h3 class="text-base font-bold text-highlighted tracking-tight truncate">Conciliación Rápida</h3>
      </div>
      <UBadge v-if="data" color="success" variant="subtle" size="sm" class="font-semibold shrink-0 tabular-nums">
        {{ data.completionLabel }}
      </UBadge>
    </div>

    <template v-if="loading && !data">
      <div class="flex flex-col gap-3 animate-pulse">
        <div class="h-20 rounded-lg bg-elevated" />
        <div class="h-10 rounded-lg bg-elevated" />
      </div>
    </template>

    <template v-else-if="data">
      <div class="rounded-lg border border-muted bg-elevated/60 px-3.5 py-3 flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="text-muted font-medium">Estado de Cuentas:</span>
          <span class="text-highlighted font-bold text-right tabular-nums">{{ data.statusLabel }}</span>
        </div>
        <div class="h-1 rounded-full bg-elevated overflow-hidden">
          <div
            class="h-full rounded-full bg-blue-500 transition-[width] duration-500"
            :style="{ width: `${rate}%` }"
          />
        </div>
        <p v-if="pendienteTexto" class="flex items-start gap-1.5 text-xs text-red-600/90 dark:text-red-300/90 font-medium leading-relaxed">
          <UIcon name="i-lucide-triangle-alert" class="size-3.5 mt-0.5 shrink-0" />
          <span>{{ pendienteTexto }}</span>
        </p>
        <p v-else class="flex items-center gap-1.5 text-xs text-emerald-600/90 dark:text-emerald-300/90 font-medium">
          <UIcon name="i-lucide-circle-check" class="size-3.5 shrink-0" />
          <span>Todas las cuentas cuadradas.</span>
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <UButton
          color="neutral"
          variant="soft"
          size="md"
          icon="i-lucide-file-up"
          label="Importar Extracto (CSV / OFX)"
          class="w-full justify-center font-semibold"
          @click="emit('import')"
        />
        <p class="text-center text-[11px] text-dimmed font-medium leading-relaxed">
          Compatible con formato bancario estándar y MT940
        </p>
      </div>
    </template>

    <div v-else class="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-dashed border-default bg-elevated/60">
      <UIcon name="i-lucide-settings" class="size-6 text-dimmed" />
      <p class="text-xs text-muted font-medium">Sin datos de conciliación.</p>
    </div>
  </UCard>
</template>
