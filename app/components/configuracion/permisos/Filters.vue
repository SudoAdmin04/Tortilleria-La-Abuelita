<script setup lang="ts">
import type { Role } from "~/services/roles.service";

const props = withDefaults(
  defineProps<{
    roles?: Role[];
    loadingRoles?: boolean;
    saving?: boolean;
    dirty?: boolean;
    assignedCount?: number;
    totalCount?: number;
  }>(),
  {
    roles: () => [],
    loadingRoles: false,
    saving: false,
    dirty: false,
    assignedCount: 0,
    totalCount: 0,
  }
);

const emit = defineEmits<{
  "select-role": [roleId: number | null];
  "activar-todos": [];
  "desactivar-todos": [];
  save: [];
  discard: [];
}>();

const search = defineModel<string>("search", { default: "" });
const selectedRoleId = defineModel<number | null>("selectedRoleId", {
  default: null,
});

const roleOptions = computed(() =>
  (props.roles || []).map((r) => ({
    label: r.name ?? `Rol #${r.id}`,
    description: r.description ?? undefined,
    value: r.id,
  }))
);

function onSelectRole(v: number | null | { value: number }) {
  const id =
    v == null ? null : typeof v === "object" ? (v as any).value ?? null : v;
  emit("select-role", id);
}

const hasRole = computed(() => selectedRoleId.value != null);
</script>

<template>
  <UCard class="shrink-0" :ui="{ body: 'p-3 sm:p-4' }">
    <div class="flex flex-col gap-4">
      <div
        class="flex flex-col sm:flex-row w-full justify-between items-stretch sm:items-center gap-3"
      >
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          class="w-full sm:max-w-xs"
          placeholder="Buscar en las pantallas..."
          size="md"
        />

        <div
          class="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto"
        >
          <USelectMenu
            v-model="selectedRoleId"
            :items="roleOptions"
            :loading="props.loadingRoles"
            label-key="label"
            value-key="value"
            placeholder="Seleccionar Rol"
            class="w-full sm:w-56"
            size="md"
            clearable
            @update:model-value="onSelectRole($event as any)"
          />
          <UButton
            color="primary"
            variant="soft"
            label="Activar Todos"
            size="md"
            :disabled="!hasRole || props.saving"
            @click="emit('activar-todos')"
          />
          <UButton
            color="error"
            variant="ghost"
            label="Quitar Todos"
            size="md"
            :disabled="!hasRole || props.saving"
            @click="emit('desactivar-todos')"
          />
        </div>
      </div>

      <div
        v-if="hasRole"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-muted"
      >
        <p class="text-xs text-muted">
          {{ props.assignedCount }} de {{ props.totalCount }} pantallas con
          acceso
          <span v-if="props.dirty" class="text-warning font-medium">
            • cambios sin guardar
          </span>
        </p>
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            label="Descartar"
            size="sm"
            :disabled="!props.dirty || props.saving"
            @click="emit('discard')"
          />
          <UButton
            color="success"
            label="Guardar permisos"
            icon="i-lucide-circle-check"
            size="lg"
            :loading="props.saving"
            :disabled="!props.dirty || props.saving"
            @click="emit('save')"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>
