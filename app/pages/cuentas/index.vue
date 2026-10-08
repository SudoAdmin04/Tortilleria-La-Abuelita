
<script setup lang="ts">
import { listAccounts, createAccount, updateAccount, deleteAccount, type Account } from '~/services/accounts.service'
import { formatMoney } from '~/utils/format'
import { getApiMessage } from '~/utils/api-error'

useHead({ title: 'Cuentas' })

const auth = useAuthStore()
const permisos = usePermisosStore()
const toast = useToast()
const currency = computed(() => auth.user?.currency || 'MXN')
const puedeCrear = computed(() => permisos.can('/cuentas', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/cuentas', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/cuentas', 'canDelete'))

const items = ref<Account[]>([])
const drawer = ref(false)
const saving = ref(false)
const editId = ref<string | null>(null)
const form = reactive({ name: '', type: 'checking', institution: '', initialBalance: 0, isPrimary: false })

async function recargar() {
  try {
    items.value = await listAccounts()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar'), color: 'error' })
  }
}

function abrirCrear() {
  editId.value = null
  Object.assign(form, { name: '', type: 'checking', institution: '', initialBalance: 0, isPrimary: false })
  drawer.value = true
}

function abrirEditar(a: Account) {
  editId.value = a.id
  Object.assign(form, { name: a.name, type: a.type, institution: a.institution || '', initialBalance: a.initialBalance, isPrimary: a.isPrimary })
  drawer.value = true
}

async function guardar() {
  saving.value = true
  try {
    const payload: any = { name: form.name, type: form.type, institution: form.institution || undefined, currency: currency.value, initialBalance: Number(form.initialBalance), isPrimary: form.isPrimary }
    if (editId.value) await updateAccount(editId.value, payload)
    else await createAccount(payload)
    toast.add({ title: 'Guardado', color: 'success' })
    drawer.value = false
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo guardar'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function eliminar(a: Account) {
  try {
    await deleteAccount(a.id)
    toast.add({ title: 'Eliminada', color: 'success' })
    await recargar()
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'Si tiene movimientos, desactívala'), color: 'error' })
  }
}

onMounted(recargar)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Cuentas</h1>
        <p class="text-sm text-slate-400">Bancos, efectivo y tarjetas · balance calculado</p>
      </div>
      <UButton v-if="puedeCrear" icon="i-lucide-plus" @click="abrirCrear()">Nueva cuenta</UButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard v-for="a in items" :key="a.id">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-semibold">{{ a.name }}</p>
            <p class="text-xs text-slate-400">{{ a.type }} · {{ a.institution || '—' }}</p>
          </div>
          <UBadge v-if="a.isPrimary" color="primary" variant="soft">Principal</UBadge>
        </div>
        <p class="mt-3 text-2xl font-bold">{{ formatMoney(a.balance, currency) }}</p>
        <div class="mt-3 flex gap-1 justify-end">
          <UButton v-if="puedeEditar" size="xs" variant="ghost" icon="i-lucide-pencil" @click="abrirEditar(a)" />
          <UButton v-if="puedeEliminar" size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="eliminar(a)" />
        </div>
      </UCard>
    </div>

    <USlideover v-model:open="drawer" title="Cuenta">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="guardar">
          <UFormField label="Nombre" required><UInput v-model="form.name" class="w-full" /></UFormField>
          <UFormField label="Tipo" required>
            <USelect v-model="form.type" :items="[{ value: 'checking', label: 'Cheques' }, { value: 'savings', label: 'Ahorro' }, { value: 'cash', label: 'Efectivo' }, { value: 'credit_card', label: 'Tarjeta' }]" class="w-full" />
          </UFormField>
          <UFormField label="Institución"><UInput v-model="form.institution" class="w-full" /></UFormField>
          <UFormField label="Saldo inicial"><UInput v-model="form.initialBalance" type="number" step="0.01" class="w-full" /></UFormField>
          <UFormField label="Principal"><USwitch v-model="form.isPrimary" /></UFormField>
          <UButton type="submit" block :loading="saving">{{ editId ? 'Actualizar' : 'Crear' }}</UButton>
        </UForm>
      </template>
    </USlideover>
  </div>
</template>
