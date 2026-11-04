<script setup lang="ts">
export type StatTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

export interface StatItem {
  label: string
  value: string
  sub?: string
  icon: string
  tone?: StatTone
  progress?: number | null
}

const props = withDefaults(defineProps<{
  stats: StatItem[]
  loading?: boolean
  columns?: 3 | 4
}>(), {
  loading: false,
  columns: 4,
})

const gridClass = computed(() => props.columns === 3
  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4')

const iconBox: Record<StatTone, string> = {
  primary: 'bg-primary-500/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
  neutral: 'bg-elevated text-muted',
}

const barFill: Record<StatTone, string> = {
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-inverted/40',
}

const toneOf = (s: StatItem): StatTone => s.tone ?? 'neutral'
const barWidth = (s: StatItem) => `${Math.min(100, Math.max(0, Math.round(s.progress ?? 0)))}%`
</script>

<template>
  <div :class="gridClass">
    <template v-if="loading">
      <UCard v-for="n in props.stats.length || columns" :key="n" class="border border-default" :ui="{ body: 'p-5' }">
        <div class="flex flex-col gap-3 animate-pulse">
          <div class="flex items-center justify-between">
            <div class="h-3 w-24 rounded bg-elevated" />
            <div class="size-9 rounded-xl bg-elevated" />
          </div>
          <div class="h-7 w-2/3 rounded bg-elevated" />
          <div class="h-3 w-1/2 rounded bg-elevated" />
        </div>
      </UCard>
    </template>

    <UCard
      v-for="s in props.stats"
      v-else
      :key="s.label"
      class="border border-default transition-colors duration-200 hover:border-accented"
      :ui="{ body: 'p-5 flex flex-col gap-3' }"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="text-[11px] font-semibold uppercase tracking-widest text-muted truncate">
          {{ s.label }}
        </span>
        <span
          class="flex items-center justify-center size-9 rounded-xl shrink-0"
          :class="iconBox[toneOf(s)]"
        >
          <UIcon :name="s.icon" class="size-[18px]" />
        </span>
      </div>

      <span class="text-2xl font-bold tracking-tight text-highlighted truncate">
        {{ s.value }}
      </span>

      <span v-if="s.sub" class="text-xs text-muted truncate -mt-1.5">
        {{ s.sub }}
      </span>

      <div v-if="s.progress != null" class="h-1 rounded-full bg-elevated overflow-hidden">
        <div class="h-full rounded-full transition-[width] duration-500" :class="barFill[toneOf(s)]" :style="{ width: barWidth(s) }" />
      </div>
    </UCard>
  </div>
</template>
