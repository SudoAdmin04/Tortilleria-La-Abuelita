import { listCategories, type Category } from '~/services/categories.service'

export const useCatalogos = () => {
  const items = ref<Category[]>([])
  const loading = ref(false)

  const rubros = computed(() => items.value.filter(c => !c.parentId))
  const rubrosOptions = computed(() => rubros.value.map(r => ({ value: r.id, label: r.name })))

  function optionsFor(kind?: Category['kind']) {
    const list = kind ? items.value.filter(c => c.kind === kind) : items.value
    return list.map(c => ({ value: c.id, label: c.parentId ? `${c.name}` : c.name }))
  }

  async function ensureLoaded() {
    if (items.value.length) return items.value
    loading.value = true
    try {
      const res = await listCategories(false)
      items.value = Array.isArray(res) ? (res as Category[]) : []
    } finally {
      loading.value = false
    }
    return items.value
  }

  return { items, rubros, rubrosOptions, loading, ensureLoaded, optionsFor }
}
