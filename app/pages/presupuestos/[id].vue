<script setup lang="ts">
import type { Budget } from '~/services/budgets.service'
import { formatMoney, formatDate, monthYearLabel } from '~/utils/format'

useHead({ title: 'Detalle de presupuesto' })

const route = useRoute()
const auth = useAuthStore()
const permisos = usePermisosStore()
const currency = computed(() => auth.user?.currency || 'MXN')

const p = usePresupuestos()
const id = computed(() => String(route.params.id))
const drawerOpen = ref(false)
const editing = ref<Budget | null>(null)

const titulo = computed(() => {
  const b = p.item.value
  if (!b) return 'Presupuesto'
  return b.category?.name || 'Presupuesto'
})
const periodo = computed(() => {
  const b = p.item.value
  if (!b) return ''
  return monthYearLabel(b.year, b.month)
})

function openEdit() {
  if (!p.item.value) return
  editing.value = p.item.value
  drawerOpen.value = true
}

async function handleDelete() {
  if (!p.item.value) return
  await p.remove(p.item.value.id)
  navigateTo('/presupuestos')
}

onMounted(() => p.fetchDetalle(id.value))
onUnmounted(() => p.clearDetalle())
watch(id, v => p.fetchDetalle(v))
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" label="Volver" to="/presupuestos" />
      <span class="w-1 self-stretch rounded-full bg-primary shrink-0" />
      <div class="flex-1 min-w-40">

        <h1 class="font-display text-2xl font-semibold">{{ titulo }}</h1>
        <p class="text-sm text-slate-400">{{ periodo }}</p>
      </div>
      <UButton icon="i-lucide-square-pen" label="Ajustar" @click="openEdit" />
      <UButton icon="i-lucide-trash-2" color="error" variant="outline" label="Eliminar" @click="handleDelete" />
    </div>

    <div v-if="p.detalleLoading.value && !p.item.value" class="flex flex-col gap-3">
      <USkeleton class="h-28 w-full" />
      <USkeleton class="h-64 w-full" />
    </div>

    <template v-else-if="p.item.value">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard class="border border-white/10">
          <p class="text-xs text-slate-400">Límite mensual</p>
          <p class="text-2xl font-bold">{{ formatMoney(p.item.value.amount, currency) }}</p>
          <p class="text-xs text-white/40 mt-1">{{ p.item.value.category?.kind }}</p>
        </UCard>
        <UCard class="border border-white/10">
          <p class="text-xs text-slate-400">Categoría</p>
          <p class="text-lg font-semibold">{{ p.item.value.category?.name }}</p>
          <p class="text-xs text-white/40 mt-1 font-mono">{{ p.item.value.categoryId }}</p>
        </UCard>
        <UCard class="border border-white/10">
          <p class="text-xs text-slate-400">Actualizado</p>
          <p class="text-lg font-semibold">{{ formatDate(String(p.item.value.updatedAt)) }}</p>
          <p class="text-xs text-white/40 mt-1">Creado {{ formatDate(String(p.item.value.createdAt)) }}</p>
        </UCard>
      </div>

      <PresupuestosHistoryTimeline :items="p.history.value" :loading="p.detalleLoading.value" :currency="currency" />
    </template>

    <UAlert v-else color="warning" variant="subtle" title="No se encontró el presupuesto" description="Verifica el identificador o vuelve al listado." />

    <PresupuestosDrawer
      v-model:open="drawerOpen"
      :presupuesto="editing"
      :year="p.item.value?.year ?? new Date().getFullYear()"
      :month="p.item.value?.month ?? (new Date().getMonth() + 1)"
      :categorias="p.item.value ? [{ value: p.item.value.categoryId, label: p.item.value.category?.name || 'Categoría' }] : []"
      @refresh="p.fetchDetalle(id)"
    />
  </div>
</template>
