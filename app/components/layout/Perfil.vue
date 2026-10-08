<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth.store'

interface Props { modelValue: boolean }
const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const authStore = useAuthStore()
const drawerOpen = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const user = computed(() => authStore.user)
const closeDrawer = () => emit('update:modelValue', false)
</script>

<template>
  <UDrawer v-model:open="drawerOpen" title="Mi Cuenta" description="Información de tu sesión" direction="right" class="w-lg">
    <template #body>
      <div class="flex flex-col items-center text-center mb-6">
        <UAvatar :alt="user?.name || 'U'" size="3xl" class="w-24 h-24 mb-3" />
        <h2 class="text-xl font-bold">{{ user?.name || 'Usuario' }}</h2>
        <p class="text-sm text-neutral-500">{{ user?.email }}</p>
        <div class="flex gap-2 mt-3">
          <UBadge color="primary" variant="soft">{{ user?.role || (user?.isAdmin ? 'Admin' : 'Usuario') }}</UBadge>
          <UBadge color="neutral" variant="soft">{{ user?.currency }} · {{ user?.timezone }}</UBadge>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div class="text-sm"><span class="text-neutral-500">Correo:</span> <strong>{{ user?.email }}</strong></div>
        <div class="text-sm"><span class="text-neutral-500">Moneda:</span> <strong>{{ user?.currency }}</strong></div>
        <div class="text-sm"><span class="text-neutral-500">Zona horaria:</span> <strong>{{ user?.timezone }}</strong></div>
        <div class="text-sm"><span class="text-neutral-500">Miembro desde:</span> <strong>{{ user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX') : '—' }}</strong></div>
      </div>

      <USeparator class="my-4" />

      <h3 class="font-semibold mb-2">Pantallas asignadas ({{ user?.permisos?.length || 0 }})</h3>
      <ul class="space-y-1 text-sm">
        <li v-for="p in user?.permisos || []" :key="p.screenId" class="flex items-center gap-2">
          <UIcon :name="p.icon || 'i-lucide-layout-dashboard'" class="size-4 text-primary-500" />
          <span>{{ p.screen }}</span>
          <span class="text-neutral-400 text-xs">{{ p.path }}</span>
        </li>
      </ul>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="closeDrawer">Cerrar</UButton>
        <UButton color="error" variant="soft" icon="i-lucide-log-out" @click="authStore.logout()">Cerrar sesión</UButton>
      </div>
    </template>
  </UDrawer>
</template>
