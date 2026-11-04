<script setup lang="ts">
import type { Notification } from '~/services/notifications.service'

const open = defineModel<boolean>('open', { default: false })
const { notificaciones, loading, sinLeer, fetchNotificaciones, marcarLeida } = useNotificaciones()

onMounted(() => fetchNotificaciones())

async function handleMarcarLeida(id: string, event?: Event) {
  event?.stopPropagation()
  await marcarLeida(id)
}

function abrir(n: Notification) {
  if (!n.isRead) handleMarcarLeida(n.id)
}
</script>

<template>
  <UPopover v-model:open="open">
    <UChip :show="sinLeer > 0" color="error" size="md">
      <UButton icon="i-lucide-bell" color="neutral" variant="ghost" aria-label="Notificaciones" />
    </UChip>

    <template #content>
      <div class="w-80 sm:w-96 p-4 space-y-3">
        <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-semibold">Notificaciones</h4>
            <UBadge v-if="sinLeer > 0" color="primary" variant="soft" size="sm">
              {{ sinLeer }} nuevas
            </UBadge>
          </div>
        </div>

        <div class="max-h-72 overflow-y-auto space-y-2 pr-1">
          <div v-if="loading && !notificaciones.length" class="flex items-center justify-center py-6">
            <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
          </div>
          <template v-else>
            <div
              v-for="item in notificaciones"
              :key="item.id"
              class="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-primary-500/40 transition-colors flex flex-col gap-1 text-left cursor-pointer"
              :class="{ 'bg-neutral-50 dark:bg-neutral-800/40': !item.isRead }"
              @click="abrir(item)"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold truncate">{{ item.title }}</span>
                <UBadge v-if="!item.isRead" size="xs" color="primary" variant="solid">Nuevo</UBadge>
              </div>
              <p class="text-xs text-muted line-clamp-2">{{ item.body }}</p>
            </div>
            <div v-if="!notificaciones.length" class="py-6 text-center text-sm text-muted">
              Sin notificaciones
            </div>
          </template>
        </div>
      </div>
    </template>
  </UPopover>
</template>
