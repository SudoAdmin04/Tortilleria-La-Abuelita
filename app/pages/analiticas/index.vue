

<script setup lang="ts">
import { getAnalytics, type Analytics } from '~/services/reports.service'
import { formatMoney } from '~/utils/format'
import { getApiMessage } from '~/utils/api-error'
import type { TableColumn } from '@nuxt/ui'

const leakCols: TableColumn<{ name: string; actual: number; status: string }>[] = [
  { accessorKey: 'name', header: 'Rubro' },
  { accessorKey: 'actual', header: 'Gasto' },
  { accessorKey: 'status', header: 'Estado' },
]

useHead({ title: 'Analíticas' })

const auth = useAuthStore()
const toast = useToast()
const currency = computed(() => auth.user?.currency || 'MXN')
const months = ref(6)
const loading = ref(false)
const data = ref<Analytics | null>(null)
const kpis = computed(() => (data.value?.kpis ?? {}) as any)
const leakage = computed(() => (data.value?.leakage ?? []) as any[])
const alerts = computed(() => (data.value?.alerts ?? []) as any[])

async function recargar() {
  loading.value = true
  try {
    data.value = await getAnalytics({ months: months.value })
  } catch (e) {
    toast.add({ title: 'Error', description: getApiMessage(e, 'No se pudo cargar'), color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(recargar)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold">Analíticas</h1>
        <p class="text-sm text-slate-400">Cashflow, KPIs, fugas y alertas</p>
      </div>
      <div class="flex gap-2 items-center">
        <USelect v-model="months" :items="[3, 6, 12].map(m => ({ value: m, label: `${m} meses` }))" class="w-32" @change="recargar()" />
        <UButton variant="ghost" color="neutral" icon="i-lucide-refresh-cw" :loading="loading" @click="recargar()" />
      </div>
    </div>

    <div v-if="data" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <UCard><p class="text-xs text-slate-400">Tasa de ahorro</p><p class="text-2xl font-bold">{{ kpis.savingsRate ?? '—' }}%</p></UCard>
      <UCard><p class="text-xs text-slate-400">Liquidez</p><p class="text-2xl font-bold">{{ formatMoney(kpis.liquid, currency) }}</p></UCard>
      <UCard><p class="text-xs text-slate-400">Meses de reserva</p><p class="text-2xl font-bold">{{ kpis.runwayMonths ?? '—' }}</p></UCard>
      <UCard><p class="text-xs text-slate-400">Desviación gasto</p><p class="text-2xl font-bold">{{ formatMoney(kpis.expenseDeviation, currency) }}</p></UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <UCard>
        <template #header><h3 class="font-semibold">Fugas de gasto</h3></template>
        <UTable :data="leakage" :columns="leakCols" :loading="loading">
          <template #actual-cell="{ row }">{{ formatMoney(row.original.actual, currency) }}</template>
        </UTable>
      </UCard>
      <UCard>
        <template #header><h3 class="font-semibold">Alertas</h3></template>
        <div class="space-y-2">
          <UAlert v-for="(a, i) in alerts" :key="i" :color="a.severity === 'high' ? 'error' : 'warning'" variant="soft" :title="a.title" :description="`${formatMoney(a.actual, currency)} vs ${formatMoney(a.budget, currency)}`" />
          <p v-if="!alerts.length" class="text-sm text-slate-500">Sin alertas en el periodo.</p>
        </div>
      </UCard>
    </div>
  </div>
</template>
