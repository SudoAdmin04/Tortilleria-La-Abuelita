<script setup lang="ts">
const props = defineProps<{
  roles?: { id: number; descripcion: string }[];
}>();

const emit = defineEmits<{
  "select-role": [roleId: number | null];
  "activar-todos": [];
  "desactivar-todos": [];
}>();

const search = defineModel<string>("search", { default: "" });
const selectedRoleId = defineModel<number | null>("selectedRoleId", {
  default: null,
});

const roleOptions = computed(() =>
  (props.roles || []).map((r) => ({
    label: r.descripcion ?? `Rol #${r.id}`,
    value: r.id,
  }))
);
</script>

<template>
  <UCard class="shrink-0" :ui="{ body: 'p-3 sm:p-4' }">
    <div class="flex flex-col sm:flex-row w-full justify-between items-center gap-4">
      <UInput v-model="search" icon="i-heroicons-magnifying-glass" class="w-full sm:max-w-xs"
        placeholder="Buscar en las pantallas..." size="md" />

      <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
        <USelectMenu v-model="selectedRoleId" :items="roleOptions" label-key="label" value-key="value"
          placeholder="Seleccionar Rol" class="w-full sm:w-48" size="md"
          @update:model-value="emit('select-role', $event)" />
        <UButton color="neutral" variant="ghost" label="Activar Todos" size="md" @click="emit('activar-todos')" />
        <UButton color="error" variant="ghost" label="Quitar Todos" size="md" @click="emit('desactivar-todos')" />
      </div>
    </div>
  </UCard>
</template>
