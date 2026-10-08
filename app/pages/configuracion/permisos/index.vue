<script setup lang="ts">
const toast = useToast()
const { items: roles, loading: loadingRoles, fetchAll: fetchRoles } = useRoles()
const {
  items: pantallas,
  loading: loadingScreens,
  error: errorPantallas,
  fetchAll: fetchPantallas,
} = usePantallas()
const rolePerms = useRolePermissions()
const { permissions, dirty, assignedCount, saving } = rolePerms

const search = ref('')
const selectedRoleId = ref<number | null>(null)
const pendingRole = ref(false)

const catalogo = ref<any[]>([])
const roleEmbedded = ref<any[]>([])

function flattenScreens(roots: any[]): any[] {
  const out: any[] = []
  for (const r of roots ?? []) {
    const { children, ...rest } = r ?? {}
    if (rest?.id == null) continue
    out.push(rest)
    for (const c of children ?? []) {
      if (c?.id == null) continue
      out.push({ isActive: true, order: 9999, parentId: r.id, ...c })
    }
  }
  return out
}

function mergeScreens(a: any[], b: any[]): any[] {
  const map = new Map<number, any>()
  for (const s of a ?? []) if (s?.id != null && !map.has(s.id)) map.set(s.id, s)
  for (const s of b ?? []) {
    if (s?.id == null) continue
    map.set(s.id, map.has(s.id) ? { ...map.get(s.id), ...s } : s)
  }
  return [...map.values()]
}

const todasVisibles = computed(() => mergeScreens(catalogo.value, roleEmbedded.value))

const pending = computed(() => pendingRole.value || loadingScreens.value)

const filteredScreens = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return todasVisibles.value
  return todasVisibles.value.filter((s) =>
    s?.name?.toLowerCase().includes(q),
  )
})

async function onSelectRole(roleId: number | null) {
  selectedRoleId.value = roleId
  if (roleId == null) {
    roleEmbedded.value = []
    await rolePerms.loadByRole(null, todasVisibles.value)
    return
  }
  pendingRole.value = true
  try {
    const embedded = await rolePerms.loadByRole(roleId, catalogo.value)
    roleEmbedded.value = embedded
  } catch {
    roleEmbedded.value = []
  } finally {
    pendingRole.value = false
  }
}

function activarTodos() {
  for (const s of filteredScreens.value as any[]) {
    const p = permissions.value[s.id]
    if (!p) continue
    p.canRead = true
    p.canCreate = true
    p.canUpdate = true
    p.canDelete = true
  }
}

function desactivarTodos() {
  for (const s of filteredScreens.value as any[]) {
    const p = permissions.value[s.id]
    if (!p) continue
    p.canRead = false
    p.canCreate = false
    p.canUpdate = false
    p.canDelete = false
  }
}

function discard() {
  rolePerms.discard()
}

async function save() {
  if (selectedRoleId.value == null || saving.value) return
  try {
    await rolePerms.save(selectedRoleId.value)
  } catch {
    await onSelectRole(selectedRoleId.value)
  }
}

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchPantallas()])
  catalogo.value = flattenScreens(pantallas.value as any[])
  if (errorPantallas.value) {
  }
  permissions.value = rolePerms.buildEmpty(todasVisibles.value)
  rolePerms.snapshot(permissions.value)
  if (roles.value.length > 0 && selectedRoleId.value == null) {
    await onSelectRole((roles.value[0] as any).id)
  }
})
</script>

<template>
  <div class="space-y-6">
    <AppToolbar
      title="Permisos"
      description="Selecciona un rol y asigna el acceso a cada pantalla"
      hide-search
    />

    <ConfiguracionPermisosFilters
      v-model:search="search"
      v-model:selected-role-id="selectedRoleId"
      :roles="roles"
      :loading-roles="loadingRoles"
      :saving="saving"
      :dirty="dirty"
      :assigned-count="assignedCount"
      :total-count="todasVisibles.length"
      @select-role="onSelectRole"
      @activar-todos="activarTodos"
      @desactivar-todos="desactivarTodos"
      @save="save"
      @discard="discard"
    />

    <ConfiguracionPermisosDetails
      v-model:permissions="permissions"
      :items="filteredScreens"
      :pending="pending"
      :disabled="saving || selectedRoleId == null"
      :no-role-selected="selectedRoleId == null"
      :search="search"
    />
  </div>
</template>
