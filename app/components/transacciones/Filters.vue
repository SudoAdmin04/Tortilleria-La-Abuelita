<script setup lang="ts">
export interface CatalogoOpt { value: string; label: string }

const tipo = defineModel<string | undefined>('tipo', { default: undefined })
const estado = defineModel<string | undefined>('estado', { default: undefined })
const cuentaId = defineModel<string | undefined>('cuentaId', { default: undefined })
const categoriaId = defineModel<string | undefined>('categoriaId', { default: undefined })
const search = defineModel<string>('search', { default: '' })

defineProps<{
  cuentas?: CatalogoOpt[]
  categorias?: CatalogoOpt[]
}>()

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

const tipoItems = [
  { value: undefined, label: 'Todos los tipos' },
  { value: 'income', label: 'Ingreso' },
  { value: 'expense', label: 'Egreso' },
  { value: 'transfer', label: 'Traspaso' },
]

const estadoItems = [
  { value: undefined, label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'reconciled', label: 'Conciliado' },
]
</script>

<template>
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
    <USelectMenu
      v-model="tipo"
      :items="tipoItems"
      value-key="value"
      label-key="label"
      placeholder="Tipo"
      class="w-full sm:w-48"
      @update:model-value="emit('filtrar')"
    />
    <USelectMenu
      v-model="estado"
      :items="estadoItems"
      value-key="value"
      label-key="label"
      placeholder="Estado"
      class="w-full sm:w-48"
      @update:model-value="emit('filtrar')"
    />
    <USelectMenu
      v-model="cuentaId"
      :items="[{ value: undefined, label: 'Todas las cuentas' }, ...(cuentas ?? [])]"
      value-key="value"
      label-key="label"
      placeholder="Cuenta"
      class="w-full sm:w-56"
      @update:model-value="emit('filtrar')"
    />
    <USelectMenu
      v-model="categoriaId"
      :items="[{ value: undefined, label: 'Todas las categorías' }, ...(categorias ?? [])]"
      value-key="value"
      label-key="label"
      placeholder="Categoría"
      class="w-full sm:w-56"
      @update:model-value="emit('filtrar')"
    />
    <UButton
      v-if="hayFiltros"
      color="neutral"
      variant="subtle"
      label="Limpiar"
      size="sm"
      class="shrink-0"
      @click="emit('limpiar')"
    />
  </div>
</template>
