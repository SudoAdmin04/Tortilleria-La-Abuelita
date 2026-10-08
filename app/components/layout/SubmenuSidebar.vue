<script setup lang="ts">
import type { NavigationMenuItem } from '#ui/types'

export interface SubmenuGroup {
  module: string
  label: string
  items: NavigationMenuItem[]
}

const props = withDefaults(defineProps<{
  groups?: SubmenuGroup[]
  title?: string
}>(), {
  groups: undefined,
  title: 'Configuración General',
})

const { configGroups: storeGroups } = useMenu()
const collapsed = defineModel<boolean>('collapsed', { default: false })

const persistedCollapsed = useCookie<{ size: number; collapsed: boolean }>('dashboard-sidebar-config-submenu')
if (persistedCollapsed.value?.collapsed) {
  persistedCollapsed.value = { size: persistedCollapsed.value.size ?? 15, collapsed: false }
}
collapsed.value = false
onMounted(() => { collapsed.value = false })

const groups = computed<SubmenuGroup[]>(() => props.groups ?? storeGroups.value)

const collapsedModules = ref(new Set<string>())
const isModuleOpen = (key: string) => !collapsedModules.value.has(key)
const toggleModule = (key: string) => {
  const next = new Set(collapsedModules.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsedModules.value = next
}

const flatRail = computed<NavigationMenuItem[]>(() =>
  groups.value.flatMap(g => g.items)
)

const menuUi = {
  list: 'flex flex-col gap-1 w-full',
  item: 'w-full',
  link: [
    'group relative flex items-center w-full text-sm transition-all duration-150 font-light',
    'rounded-xl',
    'border-s-3 border-s-transparent',
    'text-white/70 hover:bg-white/5 hover:text-primary-200 hover:border-s-primary-200',
    'data-[active=true]:bg-neutral-800/90 data-[active=true]:text-white data-[active=true]:border-s-primary data-[active=true]:shadow-md',
    'aria-[current=page]:bg-neutral-800/90 aria-[current=page]:text-white aria-[current=page]:border-s-primary aria-[current=page]:shadow-md'
  ].join(' '),
  linkLeadingIcon: 'size-5 shrink-0 text-white/60 group-hover:text-primary-200 group-data-[active=true]:text-primary group-aria-[current=page]:text-white transition-colors',
  linkLabel: 'truncate',
  linkTrailingIcon: 'size-4 shrink-0 text-white/40 group-hover:text-white/70 group-data-[active=true]:text-primary group-aria-[current=page]:text-primary',
}
</script>

<template>
  <UDashboardSidebar
    id="config-submenu"
    v-model:collapsed="collapsed"
    collapsible
    :toggle="false"
    class="bg-neutral-900/80 border-r border-white/5"
  >
    <template #header="{ collapsed: isCollapsed, collapse }">
      <div class="flex w-full items-center" :class="isCollapsed ? 'justify-center' : 'justify-between gap-2'">
        <div v-if="!isCollapsed && title" class="flex items-center gap-2 min-w-0 flex-1">
          <h2 class="min-w-0 flex-1 truncate text-xs font-bold text-white uppercase tracking-wider">
            {{ title }}
          </h2>
        </div>

        <UButton
          :icon="isCollapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          variant="ghost"
          color="neutral"
          square
          size="xs"
          class="text-white/40 hover:text-white hover:bg-white/5"
          :aria-label="isCollapsed ? 'Expandir submenú' : 'Contraer submenú'"
          @click="collapse(!isCollapsed)"
        />
      </div>
    </template>

    <template #default="{ collapsed: isCollapsed }">
      <div v-if="isCollapsed">
        <UNavigationMenu
          :items="flatRail"
          orientation="vertical"
          :collapsed="true"
          :ui="menuUi"
          tooltip
          class="w-full"
        />
      </div>

      <template v-else-if="groups.length">
        <div class="flex flex-col gap-6">
          <section v-for="group in groups" :key="group.module" class="flex flex-col">
            <button
              type="button"
              class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] text-white/90 hover:bg-white/10 hover:text-white transition-colors cursor-pointer border border-white/5"
              :aria-expanded="isModuleOpen(group.module)"
              @click="toggleModule(group.module)"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="size-1.5 rounded-full bg-primary/70 shrink-0"></span>
                <span class="truncate text-[11px] font-bold uppercase tracking-wider text-white/80">
                  {{ group.label }}
                </span>
              </div>

              <UIcon
                name="i-lucide-chevron-down"
                class="size-3.5 transition-transform shrink-0 text-white/50"
                :class="!isModuleOpen(group.module) && '-rotate-90'"
              />
            </button>

            <div v-show="isModuleOpen(group.module)" class="mt-2 pl-3">
              <UNavigationMenu
                :items="group.items"
                orientation="vertical"
                :ui="menuUi"
                class="w-full"
              />
            </div>
          </section>
        </div>
      </template>

      <p v-else class="text-xs text-white/40 p-2">Sin opciones asignadas.</p>
    </template>
  </UDashboardSidebar>
</template>