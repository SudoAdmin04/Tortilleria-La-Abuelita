<script setup lang="ts">
export interface EstadoConteos { total: number; open: number; paid: number }

const status = defineModel<string | undefined>('status', { default: undefined })
const direction = defineModel<string | undefined>('direction', { default: undefined })
const search = defineModel<string>('search', { default: '' })

const props = withDefaults(defineProps<{
  conteos?: EstadoConteos | null
}>(), {
  conteos: null,
})

const emit = defineEmits<{
  filtrar: []
  limpiar: []
}>()

const hayFiltros = computed(() =>
  !!status.value
  || !!direction.value
  || (typeof search.value === 'string' && search.value.trim() !== ''),
)

const filtrosActivos = computed(() =>
  [status.value, direction.value].filter(Boolean).length
  + ((typeof search.value === 'string' && search.value.trim() !== '') ? 1 : 0),
)

const estadoTabs = computed(() => [
  { value: undefined as string | undefined, label: 'Todas', count: props.conteos?.total },
  { value: 'open', label: 'Vigentes', count: props.conteos?.open },
  { value: 'paid', label: 'Liquidadas', count: props.conteos?.paid },
])

function setStatus(v: string | undefined) {
  if (status.value === v) return
  status.value = v
  emit('filtrar')
}

const directionItems = [
  { value: undefined, label: 'Ambas direcciones' },
  { value: 'payable', label: 'Yo debo' },
  { value: 'receivable', label: 'Me deben' },
]
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
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <UIcon name="i-lucide-list-filter" class="size-4 text-white/50 shrink-0" />
          <span class="text-sm font-bold text-white tracking-wide truncate">Filtros</span>
          <UBadge v-if="filtrosActivos > 0" color="primary" variant="subtle" size="sm" class="font-semibold shrink-0">
            {{ filtrosActivos }} activo{{ filtrosActivos === 1 ? '' : 's' }}
          </UBadge>
        </div>
        <UButton
          v-if="hayFiltros"
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-x"
          label="Limpiar filtros"
          class="shrink-0 text-white/60 hover:text-white"
          @click="emit('limpiar')"
        />
      </div>
    </template>

    <div class="flex flex-wrap items-center gap-1.5 rounded-xl bg-white/[0.03] border border-white/5 p-1.5 w-fit max-w-full">
      <UButton
        v-for="t in estadoTabs"
        :key="t.label"
        size="sm"
        :color="status === t.value ? 'primary' : 'neutral'"
        :variant="status === t.value ? 'solid' : 'ghost'"
        class="rounded-lg font-semibold"
        @click="setStatus(t.value)"
      >
        <span class="flex items-center gap-1.5">
          {{ t.label }}
          <span v-if="t.count != null" class="tabular-nums opacity-80">({{ t.count }})</span>
        </span>
      </UButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <UFormField label="Dirección" size="sm" class="w-full">
        <USelectMenu
          v-model="direction"
          :items="directionItems"
          value-key="value"
          label-key="label"
          placeholder="Ambas direcciones"
          icon="i-lucide-arrow-left-right"
          size="md"
          class="w-full"
          @update:model-value="emit('filtrar')"
        />
      </UFormField>
    </div>
  </UCard>
</template>
