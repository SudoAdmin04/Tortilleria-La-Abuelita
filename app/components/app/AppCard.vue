<script setup lang="ts">
defineProps<{ title?: string; icon?: string; padding?: boolean }>()
</script>

<template>
  <UCard :ui="{ base: 'shadow-sm border-border hover:shadow-md transition-shadow duration-200', body: { padding: padding === false ? '!p-0' : '' } }">
    <template v-if="title || icon" #header>
      <div class="flex items-center gap-2">
        <UIcon v-if="icon" :name="icon" class="w-5 h-5 text-primary" />
        <h3 class="text-sm font-semibold text-text">{{ title }}</h3>
      </div>
    </template>
    <slot />
  </UCard>
</template>
