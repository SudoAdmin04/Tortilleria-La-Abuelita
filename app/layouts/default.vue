<script setup lang="ts">
const route = useRoute()
const isConfigSection = computed(() => route.path === '/configuracion' || route.path.startsWith('/configuracion/'))
</script>

<template>
  <div class="min-h-screen w-full bg-muted">
    <ClientOnly>
      <UDashboardGroup>
        <LayoutAppSidebar />

        <UDashboardPanel grow class="flex flex-col h-screen overflow-hidden">
          <LayoutAppHeader />

          <div class="flex flex-1 min-h-0 overflow-hidden">
            <LayoutSubmenuSidebar v-if="isConfigSection" title="Configuración General" />

            <UDashboardPage class="flex-1 overflow-y-auto relative p-4">
              <UDashboardPanelContent>
                <slot />
              </UDashboardPanelContent>
            </UDashboardPage>
          </div>
        </UDashboardPanel>
      </UDashboardGroup>
    </ClientOnly>
  </div>
</template>