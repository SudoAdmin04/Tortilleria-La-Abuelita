<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatDate } from '~/utils/format'
import { getApiMessage } from '~/utils/api-error'

definePageMeta({ skipPermissionCheck: true })
useHead({ title: 'Perfil de Usuario' })

const authStore = useAuthStore()
const toast = useToast()

const user = computed(() => authStore.user)
const refreshing = ref(false)
const copying = ref(false)
const loadError = ref<unknown>(null)

const initials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return 'U'
  return name.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
})

const displayRole = computed(() => user.value?.role || (user.value?.isAdmin ? 'Admin' : 'Usuario'))
const memberSince = computed(() => formatDate(user.value?.createdAt))
const updatedLabel = computed(() => formatDate(user.value?.updatedAt))

const currencyLabel = computed(() => {
  const code = user.value?.currency || 'MXN'
  const names: Record<string, string> = { MXN: 'Peso Mexicano', USD: 'Dólar Estadounidense', EUR: 'Euro' }
  return names[code] ? `${code} — ${names[code]}` : code
})

const horaLocal = computed(() => {
  const tz = user.value?.timezone || 'America/Monterrey'
  try {
    return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date())
  } catch { return '—' }
})

async function refreshProfile() {
  if (refreshing.value) return
  refreshing.value = true
  loadError.value = null
  try { await authStore.fetchProfile() } catch (e) { loadError.value = e } finally { refreshing.value = false }
}

async function copyId() {
  if (!user.value?.id) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(user.value.id)
    toast.add({ title: 'ID copiado', color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo copiar', color: 'error' })
  } finally { copying.value = false }
}

onMounted(() => { if (!user.value) void refreshProfile() })
</script>

<template>
  <div class="flex flex-col gap-6">
<div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex items-stretch gap-3">
        <span class="w-1 rounded-full bg-primary shrink-0" />

        <div>
          <h1 class="font-display text-2xl font-semibold tracking-tight">
            Perfil de Usuario
          </h1>
          <p class="text-sm text-slate-400 mt-0.5">
            Datos de tu sesión en {{ user?.currency || 'MXN' }} · {{ user?.timezone || 'America/Monterrey' }}
          </p>
        </div>
      </div>
    </div>

    <UAlert
      v-if="loadError"
      color="error"
      variant="soft"
      title="No se pudo cargar el perfil"
      :description="getApiMessage(loadError)"
    >
      <template #actions>
        <UButton color="error" variant="solid" size="sm" @click="refreshProfile()">Reintentar</UButton>
      </template>
    </UAlert>

    <div v-if="!user && refreshing" class="flex flex-col gap-4">
      <USkeleton class="h-52" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <USkeleton class="h-72 lg:col-span-2" />
        <USkeleton class="h-72" />
      </div>
    </div>

    <template v-else>
      <UCard>
        <div class="flex items-start gap-4 min-w-0">
          <div class="relative shrink-0">
            <UAvatar :text="initials" :alt="user?.name || 'U'" size="3xl" class="w-20 h-20" />
            <UBadge
              :color="user?.isActive === false ? 'error' : 'success'"
              variant="solid"
              size="xs"
              class="absolute -bottom-2 left-1/2 -translate-x-1/2"
            >
              {{ user?.isActive === false ? 'Inactivo' : 'Activo' }}
            </UBadge>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-2xl font-bold tracking-tight">{{ user?.name || 'Usuario' }}</h2>
              <UBadge color="primary" variant="soft" icon="i-lucide-shield">{{ displayRole }}</UBadge>
              <UBadge v-if="user?.roleId != null" color="neutral" variant="soft">Role ID: #{{ user.roleId }}</UBadge>
            </div>
            <p class="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <UIcon name="i-lucide-mail" class="size-4" />
              {{ user?.email || '—' }}
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <UBadge color="neutral" variant="soft" icon="i-lucide-coins">{{ currencyLabel }}</UBadge>
              <UBadge color="neutral" variant="soft" icon="i-lucide-globe">{{ user?.timezone || '—' }}</UBadge>
              <UBadge v-if="user?.isAdmin" color="warning" variant="soft" icon="i-lucide-crown">Acceso Total</UBadge>
            </div>
          </div>
        </div>
      </UCard>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div class="flex flex-col gap-4 lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-id-card" class="w-5 h-5 text-white" />
                  <div>
                    <h3 class="text-sm font-semibold">Información General y Credenciales</h3>
                    <p class="text-xs text-slate-400">Datos de identificación fiscal y operativa del usuario</p>
                  </div>
                </div>
                <UBadge color="success" variant="soft" icon="i-lucide-badge-check">Cuenta Verificada</UBadge>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium">Nombre Completo</label>
                <UInput :model-value="user?.name || ''" icon="i-lucide-user" readonly class="w-full mt-1" />
              </div>
              <div>
                <label class="text-sm font-medium">Correo Electrónico</label>
                <div class="flex gap-2 mt-1">
                  <UInput :model-value="user?.email || ''" icon="i-lucide-at-sign" readonly class="w-full" />
                  <UBadge color="success" variant="soft" icon="i-lucide-badge-check" class="shrink-0 self-center">Validado</UBadge>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <label class="text-sm font-medium">ID de Cuenta del Sistema (UUID Universal)</label>
                <span class="text-xs text-slate-400">Identificador inmutable para transacciones API</span>
              </div>
              <div class="flex gap-2 mt-1">
                <UInput :model-value="user?.id || ''" icon="i-lucide-key-round" readonly :ui="{ base: 'font-mono text-xs' }" class="w-full" />
                <UButton color="neutral" variant="soft" icon="i-lucide-copy" :loading="copying" class="shrink-0" @click="copyId">
                  Copiar
                </UButton>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <p class="text-sm text-neutral-500">Rol en el Sistema</p>
                <p class="font-semibold flex items-center gap-2">{{ displayRole }} <UIcon name="i-lucide-shield-check" class="size-4 text-primary" /></p>
                <p class="text-xs text-slate-400 mt-0.5">{{ user?.isAdmin ? 'Acceso Total e Irrestricto' : 'Acceso según permisos del rol' }}</p>
              </div>
              <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <p class="text-sm text-neutral-500">Estado de Cuenta</p>
                <p class="font-semibold" :class="user?.isActive === false ? 'text-error' : 'text-success'">
                  {{ user?.isActive === false ? 'Inactiva' : 'Activa y Operativa' }}
                </p>
                <p class="text-xs text-slate-400 mt-0.5">{{ user?.isActive === false ? 'Con restricciones de acceso' : 'Sin restricciones de retiro o débito' }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-globe" class="w-5 h-5 text-white" />
                  <div>
                    <h3 class="text-sm font-semibold">Preferencias Regionales y de Moneda</h3>
                    <p class="text-xs text-slate-400">Configuración de divisa de consolidación y estándares cronológicos</p>
                  </div>
                </div>
                <UIcon name="i-lucide-sliders-horizontal" class="size-5 text-slate-400" />
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium">Moneda Principal de la Cuenta</label>
                <UInput :model-value="currencyLabel" icon="i-lucide-coins" readonly class="w-full mt-1" />
                <p class="text-xs text-slate-400 mt-1">Los balances globales se recalculan al tipo de cambio interbancario.</p>
              </div>
              <div>
                <label class="text-sm font-medium">Zona Horaria Local</label>
                <UInput :model-value="user?.timezone || ''" icon="i-lucide-clock" readonly class="w-full mt-1" />
                <p class="text-xs text-success mt-1 flex items-center gap-1">
                  <UIcon name="i-lucide-refresh-cw" class="size-3.5" /> Hora local actual: {{ horaLocal }} · Sincronizado
                </p>
              </div>
              <div>
                <label class="text-sm font-medium">Formato de Fecha</label>
                <UInput model-value="DD/MM/YYYY (Ej. 14/10/2026)" icon="i-lucide-calendar-days" disabled class="w-full mt-1" />
              </div>
              <div>
                <label class="text-sm font-medium">Separador Decimal y Miles</label>
                <UInput model-value="1,234,567.89 (Coma de miles, punto decimal)" icon="i-lucide-hash" disabled class="w-full mt-1" />
              </div>
            </div>
            <p class="text-xs text-slate-400 mt-3">Formato y separadores solo visuales: el backend solo guarda moneda y zona horaria del perfil.</p>
          </UCard>
        </div>

        <div class="flex flex-col gap-4">
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-activity" class="w-5 h-5 text-white" />
                <h3 class="text-sm font-semibold">Resumen de cuenta</h3>
              </div>
            </template>
            <dl class="grid grid-cols-1 gap-3 text-sm">
              <div class="flex justify-between gap-2"><dt class="text-neutral-500">Miembro desde</dt><dd class="font-semibold">{{ memberSince }}</dd></div>
              <div class="flex justify-between gap-2"><dt class="text-neutral-500">Actualizado</dt><dd class="font-semibold">{{ updatedLabel }}</dd></div>
              <div class="flex justify-between gap-2"><dt class="text-neutral-500">Estado</dt><dd class="font-semibold" :class="user?.isActive === false ? 'text-error' : 'text-success'">{{ user?.isActive === false ? 'Inactivo' : 'Activa' }}</dd></div>
            </dl>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-lock" class="w-5 h-5 text-white" />
                <h3 class="text-sm font-semibold">Sesión</h3>
              </div>
            </template>
            <p class="text-xs text-slate-400">Cierra tu sesión en este dispositivo. Tendrás que volver a iniciar sesión.</p>
            <UButton color="error" variant="soft" icon="i-lucide-log-out" block class="mt-3" @click="authStore.logout()">
              Cerrar Sesión
            </UButton>
          </UCard>
        </div>
      </div>
    </template>
  </div>
</template>
