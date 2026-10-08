<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  items: any[];
  pending: boolean;
}>();

const permissions = defineModel<Record<number, any>>("permissions", {
  default: () => ({}),
});

const permisosTipos = [
  { key: "ver", label: "Ver", color: "warning" },
  { key: "crear", label: "Crear", color: "success" },
  { key: "editar", label: "Editar", color: "primary" },
  { key: "eliminar", label: "Eliminar", color: "error" },
  { key: "adjuntos", label: "Adjuntos", color: "info" },
  { key: "reportes", label: "Reportes", color: "neutral" },
];

const structuredData = computed(() => {
  const activeItems = props.items.filter((item: any) => item.is_active !== false);
  const childrenByParent = new Map<number, any[]>();

  const roots: any[] = [];

  for (const item of activeItems) {
    if (item.parent_id == null) {
      roots.push(item);
    } else {
      const childArray = childrenByParent.get(item.parent_id) ?? [];
      childArray.push(item);
      childrenByParent.set(item.parent_id, childArray);
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

function getCountPermisos(screenId: number) {
  const perms = permissions.value[screenId];
  if (!perms) return `0 de ${permisosTipos.length}`;
  let activos = 0;
  for (const key of Object.keys(perms)) {
    if (perms[key]) activos++;
  }
  return `${activos} de ${permisosTipos.length}`;
}

function bulkAction(screenId: number, val: boolean) {
  const p = permissions.value[screenId];
  if (!p) return;
  for (const key of Object.keys(p)) {
    p[key] = val;
  }
}

function bulkActionParent(parent: any, val: boolean) {
  bulkAction(parent.id, val);
  parent.children.forEach((child: any) => bulkAction(child.id, val));
}

function cascadeToChildren(parentId: number) {
  const children = parentChildrenMap.value.get(parentId);
  if (!children) return;
  for (const child of children) {
    const perms = permissions.value[child.id];
    if (!perms) continue;
    for (const key of Object.keys(perms)) {
      perms[key] = false;
    }
  }
}

function handlePermissionChange(screenId: number, key: string, val: boolean) {
  const p = permissions.value[screenId];
  if (!p) return;

  if (key === "ver") {
    p.ver = val;
    if (!val) {
      p.crear = false;
      p.editar = false;
      p.eliminar = false;
      p.adjuntos = false;
      p.reportes = false;
      cascadeToChildren(screenId);
    }
  } else {
    p[key] = val;
    if (val) {
      p.ver = true;
    }
  }
}
</script>

<template>
  <div class="space-y-4">
    <UCard v-for="item in structuredData" :key="item.id">
      <div class="flex flex-col gap-4">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary"
              :class="{ 'cursor-pointer': item.isParent }" @click="item.isParent && toggleSection(item.id)">
              <UIcon :name="item.icon || 'i-heroicons-window'" class="size-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
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
            <UButton variant="ghost" color="neutral" size="xs" label="Activar todos" @click="
              item.isParent
                ? bulkActionParent(item, true)
                : bulkAction(item.id, true)
              " />
            <UButton variant="ghost" color="error" size="xs" label="Quitar todos" @click="
              item.isParent
                ? bulkActionParent(item, false)
                : bulkAction(item.id, false)
              " />
            <UButton v-if="item.isParent" :icon="expandedSections[item.id]
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
              " variant="ghost" color="neutral" size="sm" @click="toggleSection(item.id)" />
          </div>
        </div>

        <div v-if="permissions[item.id]" class="flex flex-wrap gap-3">
          <div v-for="tipo in permisosTipos" :key="tipo.key"
            class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors">
            <USwitch :model-value="permissions[item.id][tipo.key]"
              @update:model-value="(val: boolean) => handlePermissionChange(item.id, tipo.key, val)"
              :color="(tipo.color as any)" size="md" />
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
                <UButton variant="link" color="neutral" size="xs" label="Asignar todo"
                  @click="bulkAction(child.id, true)" />
                <UButton variant="link" color="neutral" size="xs" label="Ninguno"
                  @click="bulkAction(child.id, false)" />
              </div>
            </div>

            <div v-if="permissions[child.id]" class="flex flex-wrap gap-2 pb-2">
              <div v-for="tipo in permisosTipos" :key="tipo.key"
                class="flex items-center gap-2 px-2 py-1.5 rounded-md border border-muted bg-muted/50">
                <USwitch :model-value="permissions[child.id][tipo.key]"
                  @update:model-value="(val: boolean) => handlePermissionChange(child.id, tipo.key, val)"
                  :color="(tipo.color as any)" size="xs" />
                <span class="text-[10px] font-medium text-muted">{{
                  tipo.label
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <div v-if="props.items.length === 0 && !props.pending"
      class="flex flex-col items-center justify-center py-16 text-gray-500 bg-slate-900/20 rounded-xl border border-dashed border-gray-800">
      <UIcon name="i-heroicons-magnifying-glass" class="size-12 mb-4 opacity-10" />
      <p class="text-sm font-medium">No se encontraron pantallas.</p>
    </div>
  </div>
</template>
