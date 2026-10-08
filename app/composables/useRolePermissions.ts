import { listRoleScreensPaginado, listRoleScreens, createRoleScreen, updateRoleScreen, deleteRoleScreen, type RoleScreen, type CreateRoleScreen, type UpdateRoleScreen } from '~/services/role-screens.service'

/** Flags compatibles con CreateRoleScreenDto / UpdateRoleScreenDto del backend */
export interface PermissionFlags {
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export const emptyFlags = (): PermissionFlags => ({
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
})

function buildEmptyMap(screens: Array<{ id?: number } | any>): Record<number, PermissionFlags> {
  const m: Record<number, PermissionFlags> = {}
  for (const s of screens ?? []) {
    if (s?.id == null) continue
    m[s.id] = emptyFlags()
  }
  return m
}

export const useRolePermissions = () => {
  const toast = useToast()
  const items = ref<RoleScreen[]>([])
  const item = ref<RoleScreen | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filter = reactive({ pagina: 1, registros: 10, buscar: undefined as string | undefined })

  /** Estado de la matriz rol x pantalla */
  const permissions = ref<Record<number, PermissionFlags>>({})
  const baseline = ref<string>('{}')
  /** screenId -> roleScreenId existente en backend */
  const existingByScreen = ref(new Map<number, number>())

  const dirty = computed(() => JSON.stringify(permissions.value) !== baseline.value)

  const assignedCount = computed(
    () =>
      Object.values(permissions.value).filter(
        (p) => p.canRead || p.canCreate || p.canUpdate || p.canDelete,
      ).length,
  )

  function snapshot(m: Record<number, PermissionFlags>) {
    baseline.value = JSON.stringify(m)
  }

  function buildEmpty(screens: Array<{ id?: number } | any>) {
    return buildEmptyMap(screens)
  }

  async function fetchPaginado() {
    loading.value = true
    error.value = null
    try {
      const res = await listRoleScreensPaginado({ pagina: filter.pagina, registros: filter.registros, buscar: filter.buscar })
      items.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener permisos'
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      items.value = await listRoleScreens()
      total.value = items.value.length
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Error al obtener permisos'
    } finally {
      loading.value = false
    }
  }

  /**
   * Carga la matriz de permisos de un rol.
   * Usa GET /roles/:id (trae `roleScreens` embebidos) vía `roles.service`,
   * y mezcla con el catálogo de pantallas para no perder pantallas sin asignar.
   * @param roleId rol seleccionado (null limpia la matriz)
   * @param catalog catálogo aplanado de GET /screens
   * @returns pantallas embebidas en el rol (para enriquecer el catálogo visible)
   */
  async function loadByRole(roleId: number | null, catalog: any[] = []): Promise<any[]> {
    if (roleId == null) {
      existingByScreen.value = new Map()
      permissions.value = buildEmptyMap(catalog)
      snapshot(permissions.value)
      return []
    }
    loading.value = true
    error.value = null
    try {
      const { getRole } = await import('~/services/roles.service')
      const role = (await getRole(roleId)) as any
      const roleScreens: any[] = role?.roleScreens ?? []
      const embedded = roleScreens
        .map((rs: any) => rs?.screen)
        .filter((s: any) => s?.id != null)

      // Base: catálogo + embebidas (dedup por id, el catálogo manda en metadatos)
      const seen = new Map<number, any>()
      for (const s of [...catalog, ...embedded]) {
        if (s?.id == null) continue
        if (!seen.has(s.id)) seen.set(s.id, s)
      }
      const m = buildEmptyMap([...seen.values()])
      const map = new Map<number, number>()
      for (const rs of roleScreens) {
        const sid = rs?.screen?.id ?? rs?.screenId
        if (sid == null || !m[sid]) continue
        map.set(sid, rs.id)
        m[sid] = {
          canRead: !!rs.canRead,
          canCreate: !!rs.canCreate,
          canUpdate: !!rs.canUpdate,
          canDelete: !!rs.canDelete,
        }
      }
      permissions.value = m
      existingByScreen.value = map
      snapshot(m)
      items.value = roleScreens as RoleScreen[]
      return embedded
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'No se pudieron cargar los permisos del rol'
      existingByScreen.value = new Map()
      permissions.value = buildEmptyMap(catalog)
      snapshot(permissions.value)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Guarda el diff de la matriz contra el baseline usando las APIs de
   * `role-screens.service` (POST /role-screens, PATCH /:id, DELETE /:id).
   * Solo toca pantallas modificadas; un único toast resume el resultado.
   */
  async function save(roleId: number | null) {
    if (roleId == null || saving.value) return { created: 0, updated: 0, deleted: 0 }
    saving.value = true
    error.value = null
    try {
      const original: Record<number, PermissionFlags> = JSON.parse(baseline.value)
      let created = 0
      let updated = 0
      let deleted = 0
      for (const [sidStr, flags] of Object.entries(permissions.value)) {
        const sid = Number(sidStr)
        const orig = original[sid]
        if (orig && JSON.stringify(orig) === JSON.stringify(flags)) continue

        const hasAny = flags.canRead || flags.canCreate || flags.canUpdate || flags.canDelete
        const existingId = existingByScreen.value.get(sid)

        if (hasAny && !existingId) {
          const payload: CreateRoleScreen = { roleId, screenId: sid, ...flags }
          const r = (await createRoleScreen(payload)) as any
          if (r?.id) existingByScreen.value.set(sid, r.id)
          created++
        } else if (hasAny && existingId) {
          const payload: UpdateRoleScreen = { ...flags }
          await updateRoleScreen(existingId, payload)
          updated++
        } else if (!hasAny && existingId) {
          await deleteRoleScreen(existingId)
          existingByScreen.value.delete(sid)
          deleted++
        }
      }
      snapshot(permissions.value)
      toast.add({
        title: 'Permisos guardados',
        description:
          created + updated + deleted === 0
            ? 'Sin cambios'
            : `${created} asignados • ${updated} actualizados • ${deleted} eliminados`,
        color: 'success',
        icon: 'i-lucide-circle-check',
      })
      return { created, updated, deleted }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'No se pudieron guardar los permisos'
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      })
      throw e
    } finally {
      saving.value = false
    }
  }

  function discard() {
    try {
      permissions.value = JSON.parse(baseline.value)
    } catch {
      permissions.value = {}
    }
  }

  function clearRole() {
    existingByScreen.value = new Map()
    permissions.value = {}
    snapshot(permissions.value)
  }

  async function create(payload: CreateRoleScreen) {
    try {
      const r = await createRoleScreen(payload)
      toast.add({ title: 'Permiso asignado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al asignar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function update(id: number | string, payload: UpdateRoleScreen) {
    try {
      const r = await updateRoleScreen(id, payload)
      toast.add({ title: 'Permiso actualizado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
      return r
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'Error al actualizar', color: 'error', icon: 'i-lucide-triangle-alert' })
      return undefined
    }
  }

  async function remove(id: number | string) {
    try {
      await deleteRoleScreen(id)
      toast.add({ title: 'Permiso eliminado', color: 'success', icon: 'i-lucide-circle-check' })
      await fetchPaginado()
    } catch (e: any) {
      toast.add({ title: 'Error', description: e?.data?.message || 'No se pudo eliminar', color: 'error', icon: 'i-lucide-triangle-alert' })
    }
  }

  return { items, item, loading, saving, error, total, filter, filters: filter, permissions, baseline, existingByScreen, dirty, assignedCount, buildEmpty, snapshot, loadByRole, save, discard, clearRole, fetchPaginado, fetchAll, create, update, remove }
}
