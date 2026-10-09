<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  value: string | number
  icon: string
  color?: 'primary' | 'success' | 'error' | 'info' | 'warning' | 'neutral'
  trend?: number
  trendLabel?: string
}>(), {
  color: 'neutral'
})

const borderColors = {
  primary: 'border-l-4 border-primary-500 dark:border-primary-400',
  success: 'border-l-4 border-emerald-500 dark:border-emerald-400',
  error: 'border-l-4 border-red-500 dark:border-red-400',
  info: 'border-l-4 border-sky-500 dark:border-sky-400',
  warning: 'border-l-4 border-amber-500 dark:border-amber-400',
  neutral: 'border-l-4 border-neutral-400 dark:border-neutral-500'
}

const iconStyles = {
  primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-primary-500/20',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  neutral: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 ring-neutral-500/20'
}

const trendColors = {
  primary: 'text-primary-600 dark:text-primary-400 bg-primary-500/10 border-primary-500/20',
  success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  error: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
  info: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  neutral: 'text-neutral-600 dark:text-neutral-400 bg-neutral-500/10 border-neutral-500/20'
}
</script>

<template>
  <UCard 
    :class="[borderColors[color]]"
    class="relative group overflow-hidden transition-all duration-300  dark:hover:shadow-neutral-900/50"
    :ui="{ 
      body: 'p-5 min-h-[120px] flex flex-col justify-between relative z-10', 
      header: 'hidden', 
      footer: 'hidden' 
    }"
  >
    <UIcon
      :name="icon"
      class="absolute -right-3 -bottom-3 w-28 h-28 opacity-10 dark:opacity-15 text-neutral-800 dark:text-white pointer-events-none z-0 transition-transform duration-500 group-hover:scale-110 select-none"
    />

    <div class="flex items-start justify-between gap-3 w-full">
      <div class="space-y-0.5">
        <h3 class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {{ title }}
        </h3>
      </div>

      <div 
        :class="[iconStyles[color]]"
        class="p-2.5 rounded-xl ring-1 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        <UIcon :name="icon" class="w-5 h-5" />
      </div>
    </div>

    <div class="flex items-baseline justify-between gap-2 mt-3">
      <div class="text-neutral-900 dark:text-white font-black text-2xl lg:text-3xl tracking-tight">
        {{ value }}
      </div>

      <div v-if="trend !== undefined || trendLabel" class="shrink-0">
        <span 
          v-if="trend !== undefined"
          :class="[trendColors[color]]"
          class="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full border"
        >
          <UIcon 
            :name="trend > 0 ? 'i-lucide-trending-up' : trend < 0 ? 'i-lucide-trending-down' : 'i-lucide-minus'" 
            class="w-3.5 h-3.5"
          />
          {{ trend > 0 ? '+' : '' }}{{ trend }}%
        </span>

        <span 
          v-else-if="trendLabel" 
          class="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300"
        >
          {{ trendLabel }}
        </span>
      </div>
    </div>
  </UCard>
</template>