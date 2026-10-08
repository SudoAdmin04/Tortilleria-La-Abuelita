<script setup lang="ts">
defineProps<{ searchPlaceholder?: string }>()
const model = defineModel<string>('search', { default: '' })
const emit = defineEmits<{ create: [] }>()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    <div class="flex items-center gap-2 w-full sm:w-auto">
      <UInput v-model="model" :placeholder="searchPlaceholder || 'Buscar...'" leading-icon="i-heroicons-magnifying-glass-20-solid" size="md" class="w-full sm:w-72" />
    </div>
    <div class="flex items-center gap-2 w-full sm:w-auto">
      <slot name="actions" />
      <UButton v-if="$slots.create" color="primary" icon="i-heroicons-plus" @click="emit('create')">
        <slot name="create" />
      </UButton>
    </div>
  </div>
</template>
