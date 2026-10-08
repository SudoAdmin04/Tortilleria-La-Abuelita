<script setup lang="ts">
const route = useRoute()
const isConfigSection = computed(() => route.path === '/configuracion' || route.path.startsWith('/configuracion/'))
</script>

<template>
  <div class="min-h-screen w-full bg-muted">
    <ClientOnly>
      <UDashboardGroup>
        <!-- 1. Sidebar Principal (Nivel global) -->
        <LayoutAppSidebar />

        <!-- 2. Panel Principal Derecho -->
        <UDashboardPanel grow class="flex flex-col h-screen overflow-hidden">
          <!-- Header Superior -->
          <LayoutAppHeader />

          <!-- 3. Área de Contenido (Submenú + Página al lado) -->
          <div class="flex flex-1 min-h-0 overflow-hidden">
            <!-- Submenú lateral (Debajo del Header, al lado de la página) -->
            <LayoutSubmenuSidebar v-if="isConfigSection" title="Configuración General" />

            <!-- Contenido de la Página -->
            <UDashboardPage class="flex-1 overflow-y-auto relative p-6">
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