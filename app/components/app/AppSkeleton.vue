<script setup lang="ts">
defineProps<{ rows?: number; lines?: number }>()
</script>

<template>
  <div v-for="r in (rows || 1)" :key="r" class="space-y-3 p-4">
    <USkeleton class="h-4 w-48" />
    <div v-for="l in (lines || 3)" :key="l" class="flex gap-4">
      <USkeleton class="h-3 w-full" :class="l % 2 === 0 ? 'w-3/4' : 'w-full'" />
    </div>
  </div>
</template>
