<script setup lang="ts">
import type { BitacoraAcceso } from '~/services/bitacora-accesos.repository'

defineProps<{
  items: BitacoraAcceso[]
  loading?: boolean
}>()

function fechaCorta(iso: string): string {
  try {
    return formatDate(iso)
  } catch {
    return iso
  }
}

function horaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}
</script>

<template>
  <div>
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <AppSkeleton v-for="n in 5" :key="n" :rows="3" />
    </div>

    <div v-else-if="!items.length" class="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
      <UIcon name="i-lucide-clock" class="size-8 text-neutral-400" />
      <p class="text-sm text-neutral-500 font-medium">Sin accesos recientes.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <UCard
        v-for="item in items"
        :key="item.id"
        :ui="{ body: 'p-4 flex flex-col gap-2 border-l-2 border-primary' }"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-circle-user-round" class="size-6 text-primary shrink-0" />
            <span class="text-sm font-semibold truncate">{{ item.usuario.nombreUsuario }}</span>
          </div>
          <UBadge
            :color="item.acceso ? 'success' : 'error'"
            variant="soft"
            size="sm"
          >
            {{ item.acceso ? 'Autorizado' : 'Denegado' }}
          </UBadge>
        </div>

        <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate">
          {{ item.usuario.correo }}
        </p>

        <p class="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 min-h-8">
          {{ item.descripcion }}
        </p>

        <div class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <UIcon name="i-lucide-calendar-days" class="size-4 shrink-0" />
          <span>{{ fechaCorta(item.fechaCreacion) }}</span>
          <span class="text-neutral-300 dark:text-neutral-600">•</span>
          <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
          <span>{{ horaCorta(item.fechaCreacion) }}</span>
        </div>
      </UCard>
    </div>
  </div>
</template>
