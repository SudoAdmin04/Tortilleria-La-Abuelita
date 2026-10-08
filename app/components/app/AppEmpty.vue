<script setup lang="ts">
defineProps<{ title?: string; description?: string; icon?: string }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <UIcon :name="icon || 'i-heroicons-inbox'" class="w-16 h-16 text-text-muted/40 mb-4" />
    <h3 class="text-lg font-semibold text-text-muted">{{ title || 'Sin datos' }}</h3>
    <p class="text-sm text-text-muted/60 mt-1 max-w-sm">{{ description || 'No hay información disponible para mostrar.' }}</p>
    <slot />
  </div>
</template>
