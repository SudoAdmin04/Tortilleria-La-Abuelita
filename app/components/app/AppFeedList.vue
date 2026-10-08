<script setup lang="ts">
interface FeedItem {
  id: number | string
  icon: string
  color: string
  title?: string
  description: string
  meta?: string
}
defineProps<{ items: FeedItem[] }>()
</script>

<template>
  <div class="space-y-2">
    <div v-for="item in items" :key="item.id" class="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <UAvatar :icon="item.icon" :color="item.color as any" size="sm" />
      <div class="flex-1 min-w-0">
        <p v-if="item.title" class="text-sm font-medium text-text truncate">{{ item.title }}</p>
        <p class="text-sm text-text truncate">{{ item.description }}</p>
        <p v-if="item.meta" class="text-xs text-text-muted/60">{{ item.meta }}</p>
      </div>
    </div>
  </div>
</template>
