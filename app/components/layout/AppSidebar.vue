<script setup lang="ts">
import type { NavigationMenuItem } from '#ui/types'
import { useAuthStore } from '~/stores/auth.store'

const CONFIG_PATH = '/configuracion'

const authStore = useAuthStore()
const { mainNavItems } = useMenu()

const collapsed = defineModel<boolean>('collapsed', { default: false })

const currentUser = computed(() => authStore.user)
const userDisplayName = computed(() => currentUser.value?.name || currentUser.value?.email || 'Usuario')
const userEmail = computed(() => currentUser.value?.email || '')
const userRole = computed(() => currentUser.value?.role || (currentUser.value?.isAdmin ? 'Admin' : ''))

const handleLogout = () => authStore.logout()
const handleProfile = () => navigateTo('/perfil')

const userMenuItems = computed(() => [
  [{ label: userDisplayName.value, slot: 'account', disabled: true }],
  [{ label: 'Perfil de Usuario', icon: 'i-lucide-user-round', onSelect: handleProfile }],
  [{ label: 'Cerrar Sesión', icon: 'i-lucide-log-out', color: 'error' as const, onSelect: handleLogout }],
])

const navItems = computed<NavigationMenuItem[]>(() =>
  mainNavItems.value.filter(i => i.to !== CONFIG_PATH)
)
const configEntry = computed<NavigationMenuItem[]>(() => {
  const item = mainNavItems.value.find(i => i.to === CONFIG_PATH)
  return item ? [item] : []
})

const menuUi = {
  list: 'flex flex-col gap-1.5 w-full',
  item: 'w-full',
  link: [
    'group relative flex items-center gap-2 w-full text-sm transition-all duration-150',
    'rounded-xl',
    'border-s-3 border-s-transparent',
    'text-muted hover:bg-elevated hover:text-primary hover:border-s-primary/50',
    'data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:border-s-primary data-[active=true]:shadow-sm',
    'aria-[current=page]:bg-primary/10 aria-[current=page]:text-primary aria-[current=page]:font-semibold aria-[current=page]:border-s-primary aria-[current=page]:shadow-sm'
  ].join(' '),
  linkLeadingIcon: 'size-5 shrink-0 text-muted group-hover:text-primary group-data-[active=true]:text-primary group-aria-[current=page]:text-primary transition-colors',
  linkLabel: 'truncate',
  linkTrailingIcon: 'size-4 shrink-0 text-dimmed group-hover:text-primary group-data-[active=true]:text-primary group-aria-[current=page]:text-primary transition-colors',
}
</script>

<template>
  <UDashboardSidebar
    id="principal"
    v-model:collapsed="collapsed"
    collapsible
    class="bg-default border-e border-default"
  >
    <template #header="{ collapsed: isCollapsed, collapse }">
      <div
        class="flex w-full items-center gap-2 "
        :class="isCollapsed ? 'flex-col justify-center gap-2' : 'justify-between'"
      >
        <div v-if="!isCollapsed" class="flex min-w-0 flex-1 items-center justify-start">
          <img src="/img/Logo.png" alt="Capital Flow" class="h-20 w-auto object-contain" />
        </div>

        <UButton
          :icon="isCollapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          variant="ghost"
          color="neutral"
          square
          size="xs"
          class="text-dimmed hover:text-primary hover:bg-elevated"
          :aria-label="isCollapsed ? 'Expandir menú principal' : 'Contraer menú principal'"
          @click="collapse(!isCollapsed)"
        />
      </div>
    </template>

    <template #default="{ collapsed: isCollapsed }">
      <div class="flex flex-col h-full justify-between">
        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          :collapsed="isCollapsed"
          tooltip
          popover
          :ui="menuUi"
          class="w-full flex-1"
        />

        <div v-if="configEntry.length">
          <UNavigationMenu
            :items="configEntry"
            orientation="vertical"
            :collapsed="isCollapsed"
            :ui="menuUi"
            tooltip
            class="w-full"
          />
        </div>
      </div>
    </template>

    <template #footer="{ collapsed: isCollapsed }">
      <div class="w-full border-t border-default">
        <UDropdownMenu
          v-if="!isCollapsed"
          :items="userMenuItems"
          :content="{ align: 'end', side: 'top' }"
          class="w-full"
        >
          <UButton
            color="neutral"
            variant="ghost"
            class="w-full flex items-center justify-between p-2 hover:bg-elevated rounded-lg text-left"
          >
            <div class="flex items-center gap-3 min-w-0">
              <UAvatar :alt="userDisplayName" size="md" />
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-semibold truncate text-highlighted">{{ userDisplayName }}</span>
                <span class="text-xs text-muted truncate">{{ userEmail }}</span>
                <span v-if="userRole" class="text-[11px] text-primary truncate">{{ userRole }}</span>
              </div>
            </div>
            <UIcon name="i-lucide-ellipsis-vertical" class="size-5 text-dimmed shrink-0" />
          </UButton>
        </UDropdownMenu>

        <div v-else class="w-full flex justify-center">
          <UDropdownMenu :items="userMenuItems" :content="{ align: 'start', side: 'right' }">
            <UButton color="neutral" variant="ghost" class="p-1 rounded-full hover:bg-elevated">
              <UAvatar :alt="userDisplayName" size="sm" />
            </UButton>
          </UDropdownMenu>
        </div>
      </div>
    </template>
  </UDashboardSidebar>
</template>