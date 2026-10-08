<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: string
  searchPlaceholder?: string
  hideSearch?: boolean
  clearable?: boolean
  searchDisabled?: boolean
  createLabel?: string
  createIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Buscar...',
  clearable: true,
  createIcon: 'i-heroicons-plus',
})

const model = defineModel<string>('search', { default: '' })
const emit = defineEmits<{ create: [] }>()

const slots = useSlots()
const hasHeader = computed(() => !!(props.title || props.description || props.icon || slots.header))
const showCreate = computed(() => !!(props.createLabel || slots.create))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <slot name="header">
        <div v-if="hasHeader" class="flex items-center gap-2">
          <span class="w-1 self-stretch rounded-full bg-primary shrink-0" />

          <div v-if="props.icon" class="flex items-center justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-500 shrink-0">
            <UIcon :name="props.icon" class="size-6" />
          </div>
          <div>
            <h1 v-if="props.title" class="font-display text-2xl font-semibold">{{ props.title }}</h1>
            <p v-if="props.description" class="text-sm text-slate-400">{{ props.description }}</p>
          </div>
        </div>
        <div v-else-if="!hideSearch" class="flex items-center gap-2 w-full sm:w-auto">
          <UInput
            v-model="model"
            :placeholder="props.searchPlaceholder"
            leading-icon="i-heroicons-magnifying-glass-20-solid"
            :disabled="props.searchDisabled"
            size="md"
            class="w-full sm:w-72"
          >
            <template v-if="props.clearable && model" #trailing>
              <UButton color="neutral" variant="link" size="xs" icon="i-heroicons-x-mark-20-solid" :padded="false" aria-label="Limpiar búsqueda" @click="model = ''" />
            </template>
          </UInput>
        </div>
      </slot>

      <div class="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
        <UInput
          v-if="hasHeader && !hideSearch"
          v-model="model"
          :placeholder="props.searchPlaceholder"
          leading-icon="i-heroicons-magnifying-glass-20-solid"
          :disabled="props.searchDisabled"
          size="md"
          class="w-full sm:w-72"
        >
          <template v-if="props.clearable && model" #trailing>
            <UButton color="neutral" variant="link" size="xs" icon="i-heroicons-x-mark-20-solid" :padded="false" aria-label="Limpiar búsqueda" @click="model = ''" />
          </template>
        </UInput>
        <div class="flex items-center gap-2">
          <slot name="actions" />
          <UButton v-if="showCreate" color="primary" :icon="props.createIcon" @click="emit('create')">
            <slot name="create">{{ props.createLabel }}</slot>
          </UButton>
        </div>
      </div>
    </div>

    <div v-if="$slots.filters" class="flex flex-wrap items-center gap-2">
      <slot name="filters" />
    </div>
  </div>
</template>
