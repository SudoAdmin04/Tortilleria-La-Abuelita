
<script setup lang="ts">
import { getApiMessage } from '~/utils/api-error'

definePageMeta({ layout: 'auth', middleware: 'guest' })
useHead({ title: 'Crear cuenta' })

const auth = useAuthStore()
const toast = useToast()

const state = reactive({ name: '', email: '', password: '' })
const loading = ref(false)
const errorMessage = ref('')

function validate(s: typeof state) {
  const errors: { name: string, message: string }[] = []
  if (!s.name.trim()) errors.push({ name: 'name', message: 'El nombre es obligatorio' })
  if (!s.email) errors.push({ name: 'email', message: 'El correo es obligatorio' })
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) errors.push({ name: 'email', message: 'Correo inválido' })
  if (!s.password) errors.push({ name: 'password', message: 'La contraseña es obligatoria' })
  else if (s.password.length < 10) errors.push({ name: 'password', message: 'Mínimo 10 caracteres' })
  return errors
}

async function onSubmit() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await auth.register({ name: state.name.trim(), email: state.email.trim(), password: state.password, currency: 'MXN', timezone: 'America/Monterrey' })
    if (!res.data || res.error) {
      errorMessage.value = typeof res.error === 'string' ? res.error : 'No se pudo crear la cuenta'
      return
    }
    toast.add({ title: 'Cuenta creada', description: 'Catálogo base listo.', color: 'success' })
    await navigateTo('/')
  }
  catch (error) {
    errorMessage.value = getApiMessage(error, 'No se pudo crear la cuenta')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="text-center space-y-1">
        <h1 class="text-xl font-semibold">
          Crear cuenta
        </h1>
        <p class="text-sm text-muted">
          Se siembra tu catálogo base de categorías
        </p>
      </div>
    </template>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      class="mb-4"
    />

    <UForm :state="state" :validate="validate" @submit="onSubmit">
      <div class="space-y-4">
        <UFormField label="Nombre" name="name" required>
          <UInput
            v-model="state.name"
            placeholder="Alan"
            autocomplete="name"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Correo" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            placeholder="alan@example.com"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Contraseña" name="password" required hint="Mínimo 10 caracteres">
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••••"
            autocomplete="new-password"
            class="w-full"
          />
        </UFormField>

        <UButton type="submit" block :loading="loading">
          Registrarme
        </UButton>
      </div>
    </UForm>

    <template #footer>
      <p class="text-sm text-center text-muted">
        ¿Ya tienes cuenta?
        <NuxtLink to="/login" class="text-primary font-medium">
          Inicia sesión
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>
