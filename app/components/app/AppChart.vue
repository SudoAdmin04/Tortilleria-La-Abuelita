<script setup lang="ts">
import * as echarts from 'echarts'
import { useChartTheme } from '~/composables/useChartTheme'

const props = defineProps<{
  options: echarts.EChartsOption
  height?: string
}>()

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
const { watchTheme } = useChartTheme()

function initChart() {
  if (!chartRef.value) return
  if (chart) chart.dispose()
  chart = echarts.init(chartRef.value)
  chart.setOption(props.options)
}

onMounted(() => {
  initChart()
  watchTheme(() => { setTimeout(initChart, 100) })
})

onUnmounted(() => { chart?.dispose() })

watch(() => props.options, () => { chart?.setOption(props.options) }, { deep: true })
</script>

<template>
  <div ref="chartRef" :style="{ height: height || '320px', width: '100%' }" />
</template>
