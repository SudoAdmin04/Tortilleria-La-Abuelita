<script setup lang="ts">
import { formatMoney, formatDate } from '~/utils/format'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  goalId?: string | null
  goalName?: string | null
  currency?: string
}>()
const emit = defineEmits(['changed'])

const { balance, entries, balanceLoading, entriesLoading, fetchDetalle, removeEntry } = useMetasAhorro()

const moneda = computed(() => props.currency || 'MXN')
const cargando = computed(() => balanceLoading.value || entriesLoading.value)
const revertingId = ref<string | null>(null)

watch([open, () => props.goalId], async ([isOpen, id]) => {
  if (!isOpen || !id) return
  await fetchDetalle(id)
})

async function handleRevert(entryId: string) {
  if (!props.goalId) return
  revertingId.value = entryId
  try {
    const ok = await removeEntry(props.goalId, entryId)
    if (ok) emit('changed')
  } finally {
    revertingId.value = null
  }
}
</script>

<template>
  <UDrawer direction="right" v-model:open="open" :dismissible="false" :handle="false">
    <template #content>
      <div class="flex flex-col w-150 h-full">

        <div class="bg-white/[0.02] p-6 pb-4 flex flex-col gap-4 shrink-0 border-b border-neutral-700">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-500 shrink-0">
                <UIcon name="i-lucide-history" class="size-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                  Saldo e historial
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ props.goalName || 'Meta de ahorro' }} · ledger auditable
                </p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="rounded-full shrink-0" @click="() => { open = false }" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div v-if="cargando && !balance" class="flex items-center justify-center py-10 gap-2 text-sm text-white/50">
            <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
            Cargando saldo...
          </div>

          <div v-else-if="balance" class="grid grid-cols-3 gap-3">
            <UCard class="border border-white/10">
              <div class="flex flex-col gap-1">
                <span class="text-xs text-white/50 font-medium">Saldo neto</span>
                <span class="text-lg font-bold text-white">{{ formatMoney(balance.balance, moneda) }}</span>
              </div>
            </UCard>
            <UCard class="border border-white/10">
              <div class="flex flex-col gap-1">
                <span class="text-xs text-white/50 font-medium">Aportes</span>
                <span class="text-lg font-bold text-emerald-400">{{ formatMoney(balance.totalDeposited, moneda) }}</span>
              </div>
            </UCard>
            <UCard class="border border-white/10">
              <div class="flex flex-col gap-1">
                <span class="text-xs text-white/50 font-medium">Retiros</span>
                <span class="text-lg font-bold text-amber-400">{{ formatMoney(balance.totalWithdrawn, moneda) }}</span>
                <span class="text-xs text-white/40">{{ balance.entriesCount }} movimientos</span>
              </div>
            </UCard>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-bold text-white tracking-wide">Movimientos</span>
            <div v-if="entriesLoading && !entries.length" class="flex items-center justify-center py-8 gap-2 text-sm text-white/50">
              <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
              Cargando movimientos...
            </div>
            <div v-else-if="!entries.length" class="flex flex-col items-center justify-center py-10 gap-3">
              <UIcon name="i-lucide-circle-x" class="size-8 text-white/30" />
              <p class="text-sm text-white/50 font-medium">Sin aportes ni retiros registrados.</p>
            </div>
            <div v-else class="flex flex-col gap-2">
              <UCard
                v-for="e in entries"
                :key="e.id"
                class="border border-white/10"
                :ui="{ body: 'p-3 sm:p-4' }"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="flex items-center justify-center p-2 rounded-lg shrink-0"
                      :class="e.kind === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'"
                    >
                      <UIcon :name="e.kind === 'deposit' ? 'i-lucide-plus' : 'i-lucide-minus'" class="size-4" />
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-sm font-semibold" :class="e.kind === 'deposit' ? 'text-emerald-300' : 'text-amber-300'">
                        {{ e.kind === 'deposit' ? '+' : '−' }}{{ formatMoney(e.amount, moneda) }}
                      </span>
                      <span class="text-xs text-white/50 truncate">{{ e.concept || (e.kind === 'deposit' ? 'Aporte' : 'Retiro') }} · {{ formatDate(e.date) }}</span>
                    </div>
                  </div>
                  <UButton
                    icon="i-lucide-undo-2"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                    :loading="revertingId === e.id"
                    aria-label="Revertir movimiento"
                    @click="handleRevert(e.id)"
                  />
                </div>
              </UCard>
            </div>
          </div>
        </div>

        <div class="bg-white/[0.02] flex shrink-0 justify-end gap-3 px-4 py-4 border-t border-neutral-700">
          <UButton type="button" color="neutral" variant="outline" label="Cerrar" @click="() => { open = false }" />
        </div>

      </div>
    </template>
  </UDrawer>
</template>
