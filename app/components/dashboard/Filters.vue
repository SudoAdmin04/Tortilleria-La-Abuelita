<script setup lang="ts">
import type { Granularity, MetodoPago } from '~/services/dashboard.service'
import { GRANULARIDAD_OPTS, METODO_PAGO_OPTS, type CuentaOpt } from '~/types/dashboard'

const granularity = defineModel<Granularity>('granularity', { default: 'monthly' })
const accountId = defineModel<string | undefined>('accountId', { default: undefined })
const paymentMethod = defineModel<MetodoPago | undefined>('paymentMethod', { default: undefined })
const search = defineModel<string>('search', { default: '' })

const props = withDefaults(defineProps<{
  cuentas?: CuentaOpt[]
  periodLabel?: string
}>(), {
  cuentas: () => [],
  periodLabel: '',
})

const emit = defineEmits<{
  filtrar: []
  limpiar: []
  prevPeriod: []
  nextPeriod: []
  goCurrent: []
}>()

const hayFiltros = computed(() =>
  granularity.value !== 'monthly'
  || !!accountId.value
  || !!paymentMethod.value
  || search.value.trim() !== '',
)

const filtrosActivos = computed(() =>
  (granularity.value !== 'monthly' ? 1 : 0)
  + (accountId.value ? 1 : 0)
  + (paymentMethod.value ? 1 : 0)
  + (search.value.trim() !== '' ? 1 : 0),
)

function setGranularidad(v: Granularity) {
  if (granularity.value === v) return
  granularity.value = v
  emit('filtrar')
}
</script>

<template>
  <UCard
    class="border border-white/10"
    :ui="{
      header: 'py-3 px-4 sm:px-5 border-b border-white/10 bg-white/[0.02]',
      body: 'p-4 sm:p-5 flex flex-col gap-4',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2 min-w-0">
          <UIcon name="i-lucide-list-filter" class="size-4 text-white/50 shrink-0" />
          <span class="text-sm font-bold text-white tracking-wide truncate">Filtros</span>
          <UBadge v-if="filtrosActivos > 0" color="primary" variant="subtle" size="sm" class="font-semibold shrink-0">
            {{ filtrosActivos }} activo{{ filtrosActivos === 1 ? '' : 's' }}
          </UBadge>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="flex items-center gap-1">
            <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="xs" aria-label="Periodo anterior" @click="emit('prevPeriod')" />
            <span class="text-xs font-semibold min-w-28 text-center tabular-nums text-white/80">{{ periodLabel }}</span>
            <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="xs" aria-label="Periodo siguiente" @click="emit('nextPeriod')" />
            <UButton color="neutral" variant="soft" size="xs" @click="emit('goCurrent')">
              Hoy
            </UButton>
          </div>
          <UButton
            v-if="hayFiltros"
            color="neutral"
            variant="outline"
            size="xs"
            label="Limpiar filtros"
            class="shrink-0 text-white/60 hover:text-white"
            @click="emit('limpiar')"
          />
        </div>
      </div>
    </template>

    <div class="flex flex-wrap items-center gap-1.5 rounded-xl bg-white/[0.03] border border-white/5 p-1.5 w-fit max-w-full">
      <UButton
        v-for="t in GRANULARIDAD_OPTS"
        :key="t.value"
        size="sm"
        :color="granularity === t.value ? 'primary' : 'neutral'"
        :variant="granularity === t.value ? 'solid' : 'ghost'"
        class="rounded-lg font-semibold"
        @click="setGranularidad(t.value)"
      >
        <span class="flex items-center gap-1.5">
          {{ t.label }}
        </span>
      </UButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <UFormField label="Cuenta" size="sm" class="w-full">
        <USelectMenu
          v-model="accountId"
          :items="[{ value: undefined, label: 'Todas las cuentas' }, ...(cuentas ?? [])]"
          value-key="value"
          label-key="label"
          placeholder="Todas las cuentas"
          icon="i-lucide-wallet"
          size="md"
          class="w-full"
          @update:model-value="emit('filtrar')"
        />
      </UFormField>

      <UFormField label="Método de pago" size="sm" class="w-full">
        <USelectMenu
          v-model="paymentMethod"
          :items="METODO_PAGO_OPTS"
          value-key="value"
          label-key="label"
          placeholder="Todos los métodos"
          icon="i-lucide-credit-card"
          size="md"
          class="w-full"
          @update:model-value="emit('filtrar')"
        />
      </UFormField>

      <UFormField label="Buscar" size="sm" class="w-full">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          size="md"
          class="w-full"
          placeholder="Buscar concepto o gasto..."
        />
      </UFormField>
    </div>
  </UCard>
</template>
