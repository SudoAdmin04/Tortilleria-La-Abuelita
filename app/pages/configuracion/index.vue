<script setup lang="ts">
usePermissions()

const { configGroups } = useMenu()

const firstTo = computed<string | null>(() => {
  const firstGroup = configGroups.value[0]
  if (!firstGroup || !firstGroup.items?.length) return null

  const firstItem = firstGroup.items[0]
  return firstItem!.to || firstItem!.children?.[0]?.to || null
})

if (import.meta.client) {
  watch(
    firstTo,
    (targetPath) => {
      if (targetPath) {
        navigateTo(targetPath, { replace: true })
      }
    },
    { immediate: true }
  )
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 py-16 text-center">
    <UIcon v-if="firstTo" name="i-lucide-loader-circle" class="size-6 animate-spin text-muted" />
    <UIcon v-else name="i-lucide-shield-off" class="size-6 text-muted" />
    <p class="text-sm text-muted">
      {{ firstTo ? 'Redirigiendo a la primera opción disponible…' : 'Sin opciones de configuración asignadas.' }}
    </p>
  </div>
</template>