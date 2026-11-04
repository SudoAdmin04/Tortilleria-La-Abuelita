<script setup lang="ts">
export interface CatalogoOpt { value: string; label: string }
export interface TipoConteos { total: number; income: number; expense: number; transfer: number }

const tipo = defineModel<string | undefined>('tipo', { default: undefined })
const estado = defineModel<string | undefined>('estado', { default: undefined })
const cuentaId = defineModel<string | undefined>('cuentaId', { default: undefined })
const categoriaId = defineModel<string | undefined>('categoriaId', { default: undefined })
const search = defineModel<string>('search', { default: '' })

const props = withDefaults(defineProps<{
  cuentas?: CatalogoOpt[]
  categorias?: CatalogoOpt[]
  conteos?: TipoConteos | null
}>(), {
  cuentas: () => [],
  categorias: () => [],
  conteos: null,
})

const emit = defineEmits<{
  filtrar: []
  limpiar: []
}>()

const hayFiltros = computed(() =>
  !!tipo.value
  || !!estado.value
  || !!cuentaId.value
  || !!categoriaId.value
  || (typeof search.value === 'string' && search.value.trim() !== ''),
)

const filtrosActivos = computed(() =>
  [tipo.value, estado.value, cuentaId.value, categoriaId.value].filter(Boolean).length
  + ((typeof search.value === 'string' && search.value.trim() !== '') ? 1 : 0),
)

const tipoTabs = computed(() => [
  { value: undefined as string | undefined, label: 'Todos', count: props.conteos?.total, dot: 'bg-sky-400' },
  { value: 'income', label: 'Ingresos', count: props.conteos?.income, dot: 'bg-emerald-400' },
  { value: 'expense', label: 'Egresos', count: props.conteos?.expense, dot: 'bg-red-400' },
  { value: 'transfer', label: 'Traspasos', count: props.conteos?.transfer, dot: 'bg-inverted/40' },
])

function setTipo(v: string | undefined) {
  if (tipo.value === v) return
  tipo.value = v
  emit('filtrar')
}

const estadoItems = [
  { value: undefined, label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'reconciled', label: 'Conciliado' },
]
</script>

<template>
  <UCard
    class="border border-default"
    :ui="{
      header: 'py-3 px-4 sm:px-5 border-b border-default bg-elevated/60',
      body: 'p-4 sm:p-5 flex flex-col gap-4',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <UIcon name="i-lucide-list-filter" class="size-4 text-muted shrink-0" />
          <span class="text-sm font-bold text-highlighted tracking-wide truncate">Filtros</span>
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
          class="shrink-0 text-muted hover:text-highlighted"
          @click="emit('limpiar')"
        />
      </div>
    </template>

    <div class="flex flex-wrap items-center gap-1.5 rounded-xl bg-elevated/60 border border-muted p-1.5 w-fit max-w-full">
      <UButton
        v-for="t in tipoTabs"
        :key="t.label"
        size="sm"
        :color="tipo === t.value ? 'primary' : 'neutral'"
        :variant="tipo === t.value ? 'solid' : 'ghost'"
        class="rounded-lg font-semibold"
        @click="setTipo(t.value)"
      >
        <span class="flex items-center gap-1.5">
          {{ t.label }}
          <span v-if="t.count != null" class="tabular-nums opacity-80">({{ t.count }})</span>
        </span>
      </UButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <UFormField label="Cuenta" size="sm" class="w-full">
        <USelectMenu
          v-model="cuentaId"
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

      <UFormField label="Categoría" size="sm" class="w-full">
        <USelectMenu
          v-model="categoriaId"
          :items="[{ value: undefined, label: 'Todas las categorías' }, ...(categorias ?? [])]"
          value-key="value"
          label-key="label"
          placeholder="Todas las categorías"
          icon="i-lucide-tags"
          size="md"
          class="w-full"
          @update:model-value="emit('filtrar')"
        />
      </UFormField>

      <UFormField label="Estado" size="sm" class="w-full">
        <USelectMenu
          v-model="estado"
          :items="estadoItems"
          value-key="value"
          label-key="label"
          placeholder="Todos los estados"
          icon="i-lucide-circle-check"
          size="md"
          class="w-full"
          @update:model-value="emit('filtrar')"
        />
      </UFormField>
    </div>
  </UCard>
</template>
