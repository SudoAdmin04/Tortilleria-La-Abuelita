<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Screen } from "~/services/screens.service";

interface PermissionFlags {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const emptyFlags = (): PermissionFlags => ({
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
});

const fullFlags = (): PermissionFlags => ({
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
});

const props = withDefaults(
  defineProps<{
    items: Screen[] | any[];
    pending: boolean;
    disabled?: boolean;
    noRoleSelected?: boolean;
    search?: string;
  }>(),
  { disabled: false, noRoleSelected: false, search: "" }
);

const emit = defineEmits<{ change: [screenId: number] }>();

const permissions = defineModel<Record<number, PermissionFlags>>(
  "permissions",
  { default: () => ({}) }
);

const permisosTipos: { key: keyof PermissionFlags; label: string; color: string }[] = [
  { key: "canRead", label: "Ver", color: "warning" },
  { key: "canCreate", label: "Crear", color: "success" },
  { key: "canUpdate", label: "Editar", color: "primary" },
  { key: "canDelete", label: "Eliminar", color: "error" },
];

function getParentId(s: any): number | null {
  return s?.parentId ?? s?.parent_id ?? null;
}
function isActive(s: any): boolean {
  const v = s?.isActive ?? s?.is_active;
  return v !== false;
}
function getOrder(s: any): number {
  return s?.order ?? 9999;
}
function getName(s: any): string {
  return s?.name ?? `Pantalla #${s?.id}`;
}

function sortScreens<T extends any>(list: T[]): T[] {
  return [...list].sort((a: any, b: any) => {
    const o = getOrder(a) - getOrder(b);
    if (o !== 0) return o;
    return getName(a).localeCompare(getName(b), "es");
  });
}

const structuredData = computed(() => {
  const activeItems = (props.items || []).filter(isActive);
  const childrenByParent = new Map<number, any[]>();
  const roots: any[] = [];

  for (const item of activeItems) {
    const pid = getParentId(item);
    if (pid == null) {
      roots.push(item);
    } else {
      const arr = childrenByParent.get(pid) ?? [];
      arr.push(item);
      childrenByParent.set(pid, arr);
    }
  }

  const rootIds = new Set(roots.map((r) => r.id));
  for (const [pid, arr] of childrenByParent) {
    if (!rootIds.has(pid) && !activeItems.some((i: any) => i.id === pid)) {
      roots.push(...arr);
      childrenByParent.delete(pid);
    }
  }

  const result = roots.map((root) => {
    const children = childrenByParent.get(root.id) || [];
    return {
      ...root,
      isParent: children.length > 0,
      children: sortScreens(children),
    };
  });

  return sortScreens(result);
});

const parentChildrenMap = computed(() => {
  const map = new Map<number, any[]>();
  for (const item of structuredData.value) {
    if (item.children?.length) {
      map.set(item.id, item.children);
    }
  }
  return map;
});

const expandedSections = ref<Record<number, boolean>>({});

function toggleSection(id: number) {
  expandedSections.value[id] = !expandedSections.value[id];
}

watch(
  () => props.search,
  (q) => {
    if (q?.trim()) {
      for (const g of structuredData.value) {
        if (g.isParent) expandedSections.value[g.id] = true;
      }
    }
  }
);

function ensureEntry(screenId: number): PermissionFlags {
  let p = permissions.value[screenId];
  if (!p) {
    p = emptyFlags();
    permissions.value[screenId] = p;
  }
  return p;
}

function countActive(p?: PermissionFlags): number {
  if (!p) return 0;
  return (["canRead", "canCreate", "canUpdate", "canDelete"] as const).filter(
    (k) => p[k]
  ).length;
}

function getCountPermisos(screenId: number) {
  return `${countActive(permissions.value[screenId])} de ${permisosTipos.length}`;
}

function bulkAction(screenId: number, val: boolean) {
  if (props.disabled) return;
  const p = ensureEntry(screenId);
  p.canRead = val;
  p.canCreate = val;
  p.canUpdate = val;
  p.canDelete = val;
  emit("change", screenId);
}

function bulkActionParent(parent: any, val: boolean) {
  bulkAction(parent.id, val);
  (parent.children || []).forEach((child: any) => bulkAction(child.id, val));
}

function cascadeToChildren(parentId: number) {
  const children = parentChildrenMap.value.get(parentId);
  if (!children) return;
  for (const child of children) {
    const perms = permissions.value[child.id];
    if (!perms) continue;
    perms.canRead = false;
    perms.canCreate = false;
    perms.canUpdate = false;
    perms.canDelete = false;
  }
}

function handlePermissionChange(
  screenId: number,
  key: keyof PermissionFlags,
  val: boolean
) {
  if (props.disabled) return;
  const p = ensureEntry(screenId);

  if (key === "canRead") {
    p.canRead = val;
    if (!val) {
      p.canCreate = false;
      p.canUpdate = false;
      p.canDelete = false;
      cascadeToChildren(screenId);
    }
  } else {
    p[key] = val;
    if (val) p.canRead = true;
  }
  emit("change", screenId);
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="props.pending" class="space-y-4">
      <UCard v-for="n in 3" :key="n">
        <div class="flex items-center">
          <USkeleton class="size-10 rounded-lg" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/2" />
          </div>
        </div>
      </UCard>
    </div>

    <template v-else>
      <div
        v-if="props.noRoleSelected"
        class="flex items-center px-4 py-3 rounded-xl border border-dashed border-gray-800 bg-slate-900/20 text-gray-400"
      >
        <UIcon name="i-lucide-info" class="size-5 shrink-0" />
        <p class="text-xs">
          Vista general de todas las pantallas. Selecciona un rol arriba para
          ver y editar sus permisos.
        </p>
      </div>

      <UCard v-for="item in structuredData" :key="item.id">
      <div class="flex flex-col gap-1">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary"
              :class="{ 'cursor-pointer': item.isParent }" @click="item.isParent && toggleSection(item.id)">
              <UIcon :name="item.icon || 'i-lucide-app-window'" class="size-6" />
            </div>
            <div>
              <div class="flex items-center">
                <h3 class="font-bold text-sm">{{ item.name }}</h3>
                <UBadge v-if="item.isParent" color="neutral" variant="subtle" size="sm" class="text-[10px]">
                  {{ item.children.length }} Sub-pantallas
                </UBadge>
              </div>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ item.isParent ? "Grupo de Pantallas" : "Pantalla Individual" }}
                • {{ getCountPermisos(item.id) }} permisos activos
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton variant="soft" color="neutral" size="xs" label="Activar todos" :disabled="props.disabled" @click="
              item.isParent
                ? bulkActionParent(item, true)
                : bulkAction(item.id, true)
              " />
            <UButton variant="ghost" color="error" size="xs" label="Quitar todos" :disabled="props.disabled" @click="
              item.isParent
                ? bulkActionParent(item, false)
                : bulkAction(item.id, false)
              " />
            <UButton v-if="item.isParent" :icon="expandedSections[item.id]
              ? 'i-lucide-chevron-up'
              : 'i-lucide-chevron-down'
              " variant="ghost" color="neutral" size="sm" @click="toggleSection(item.id)" />
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <div v-for="tipo in permisosTipos" :key="tipo.key"
            class="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors">
            <USwitch :model-value="permissions[item.id]?.[tipo.key] ?? false"
              @update:model-value="(val: boolean) => handlePermissionChange(item.id, tipo.key, val)"
              :disabled="props.disabled" :color="(tipo.color as any)" size="sm" />
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted">{{
              tipo.label
            }}</span>
          </div>
        </div>

        <div v-if="item.isParent && expandedSections[item.id]" class="mt-2 space-y-4 pt-4 border-t border-muted">
          <div v-for="(child, idx) in item.children" :key="child.id" class="pl-8 relative flex flex-col gap-3">
            <div class="absolute left-4 top-0 bottom-0 w-px bg-muted"
              :class="{ 'h-1/2': idx === item.children.length - 1 }"></div>
            <div class="absolute left-4 top-1/2 w-4 h-px bg-muted"></div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <UIcon :name="child.icon || 'i-material-symbols:monitor'" class="size-4 text-muted" />
                <h4 class="text-xs font-bold">{{ child.name }}</h4>
                <span class="text-[10px] text-muted bg-muted/50 px-1.5 py-0.5 rounded">{{
                  getCountPermisos(child.id)
                }}</span>
              </div>
              <div class="flex gap-2">
                <UButton variant="link" color="neutral" size="xs" label="Asignar todo" :disabled="props.disabled"
                  @click="bulkAction(child.id, true)" />
                <UButton variant="link" color="neutral" size="xs" label="Ninguno" :disabled="props.disabled"
                  @click="bulkAction(child.id, false)" />
              </div>
            </div>

            <div class="flex flex-wrap gap-2 pb-2">
              <div v-for="tipo in permisosTipos" :key="tipo.key"
                class="flex items-center gap-2 px-2 py-1.5 rounded-md border border-muted bg-muted/50">
                <USwitch :model-value="permissions[child.id]?.[tipo.key] ?? false"
                  @update:model-value="(val: boolean) => handlePermissionChange(child.id, tipo.key, val)"
                  :disabled="props.disabled" :color="(tipo.color as any)" size="xs" />
                <span class="text-[10px] font-medium text-muted">{{
                  tipo.label
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </UCard>

      <div v-if="structuredData.length === 0"
        class="flex flex-col items-center justify-center py-16 text-gray-500 bg-slate-900/20 rounded-xl border border-dashed border-gray-800">
        <UIcon name="i-lucide-search" class="size-12 mb-4 opacity-10" />
        <p class="text-sm font-medium">No se encontraron pantallas.</p>
      </div>
    </template>
  </div>
</template>
