<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'auth'
})

const schema = z.object({
  email: z.string().min(1, 'El correo es requerido'),
  password: z.string().min(1, 'La contraseña es requerida')
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: '',
  password: '',
  remember: false
})

const loading = ref(false)
const toast = useToast()
const authStore = useAuthStore()
const colorMode = useColorMode()

const logo = computed(() => {
  return colorMode.value === 'dark'
    ? 'img/LogoLogin.png'
    : 'img/LogoLogin.png'
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const res = await authStore.login({
      email: event.data.email,
      password: event.data.password,
    })

    if (!res.data || res.error) {
      throw new Error(typeof res.error === 'string' ? res.error : 'Credenciales inválidas')
    }

    toast.add({
      title: 'Acceso Autorizado', description: 'Redirigiendo al panel de control...', color: 'success', icon: 'i-lucide-shield-check', duration: 1500,
    })

    await navigateTo('/')
  } catch (err: any) {
    toast.add({
      title: 'Acceso Denegado', description: err?.data?.message || err?.message || 'Verifica tus credenciales', color: 'error', icon: 'i-lucide-triangle-alert',
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex relative overflow-hidden login-shell">
    <div class="absolute inset-0 login-grid opacity-70" aria-hidden="true" />
    <div class="absolute inset-0 login-vignette" aria-hidden="true" />

    <div class="absolute top-4 right-4 z-20">
      <UColorModeButton
        color="neutral"
        variant="ghost"
        class="text-white/80 hover:text-white hover:bg-white/10"
      />
    </div>

    <div class="w-full flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-12 relative z-10">
      <UCard class="w-full max-w-md bg-white/90 dark:bg-neutral-900/75 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl ring-0"
        :ui="{ body: 'p-8', header: 'border-b border-white/10 dark:border-neutral-700/20' }"
      >
        <div class="_space-y-6 flex flex-row gap-4 justify-center pb-4">
          <div class="flex justify-center">
            <img :src="logo" alt="Logo" class="h-50 w-auto object-contain">
          </div>
        </div>

        <div class="mb-8 text-center">
          <h3 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Bienvenido
          </h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Ingrese correctamente sus credenciales para acceder al sistema
          </p>
        </div>

        <UForm :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
          <UFormField label="Usuario" name="correo" class="font-medium">
            <UInput v-model="state.email" icon="i-lucide-mail" size="lg" placeholder="administrador" class="w-full"/>
          </UFormField>

          <UFormField name="password">
            <template #label>
              <div class="flex justify-between w-full items-center">
                <span class="font-medium pr-2">Contraseña</span>
              </div>
            </template>
            <UInput v-model="state.password" type="password" icon="i-lucide-lock" size="lg" placeholder="••••••••" class="w-full"/>
          </UFormField>

          <UButton type="submit" block size="lg" :loading="loading" color="primary" variant="solid"
            class="rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            icon="i-lucide-log-in"
          >
            {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </UButton>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-neutral-200 dark:border-neutral-700" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-white dark:bg-neutral-900 px-3 text-neutral-500 dark:text-neutral-400">
                Acceso seguro
              </span>
            </div>
          </div>
        </UForm>

        <div class="mt-6 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 flex gap-2 items-start">
          <UIcon
            name="i-lucide-shield-check"
            class="w-4 h-4 text-(--ui-primary) shrink-0 mt-0.5"
          />
          <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            <span class="font-semibold text-neutral-700 dark:text-neutral-300">Aviso:</span> El acceso no autorizado está prohibido y todas las acciones son monitoreadas.
          </p>
        </div>

        <div class="mt-6 flex justify-between items-center px-1">
          <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
            <span class="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Sistema v4.0</span>
          </div>
          <span class="text-[10px] text-neutral-400">© {{ new Date().getFullYear() }} Centro Comercial</span>
        </div>
      </UCard>
    </div>
  </div>
</template>
