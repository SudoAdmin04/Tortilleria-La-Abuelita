<script setup lang="ts">
defineProps<{ label: string; value: string | number; icon?: string }>()
</script>

<template>
  <div class="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
    <div class="flex items-center gap-2">
      <UIcon v-if="icon" :name="icon" class="w-4 h-4 text-text-muted" />
      <span class="text-sm text-text-muted">{{ label }}</span>
    </div>
    <span class="text-sm font-semibold text-text">{{ value }}</span>
  </div>
</template>
