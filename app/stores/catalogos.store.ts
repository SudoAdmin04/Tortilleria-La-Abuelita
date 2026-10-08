import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { listCategories, type Category } from '~/services/categories.service'

/** Catálogos de Finanzas = categorías (rubros/partidas). */
export const useCatalogosStore = defineStore('catalogos', () => {
  const categorias = ref<Category[]>([])
  const loading = ref(false)

  const rubros = computed(() => categorias.value.filter(c => !c.parentId))
  const partidas = computed(() => categorias.value.filter(c => !!c.parentId))
  const isLoaded = computed(() => categorias.value.length > 0)

  async function fetchCatalogos(force = false) {
    if (isLoaded.value && !force) return categorias.value
    loading.value = true
    try {
      const res = await listCategories(false)
      categorias.value = Array.isArray(res) ? (res as Category[]) : []
      try { localStorage.setItem('catalogos', JSON.stringify(categorias.value)) } catch {}
      return categorias.value
    } finally {
      loading.value = false
    }
  }

  function loadFromStorage() {
    try {
      const s = localStorage.getItem('catalogos')
      if (s) {
        const p = JSON.parse(s)
        if (Array.isArray(p)) categorias.value = p
      }
    } catch {}
  }

  function reset() {
    categorias.value = []
    try { localStorage.removeItem('catalogos') } catch {}
  }

  return { categorias, rubros, partidas, loading, isLoaded, catalogos: categorias, fetchCatalogos, loadFromStorage, reset }
})
