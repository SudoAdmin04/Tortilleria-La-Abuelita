<script setup lang="ts">
const props = defineProps<{ title: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <AppDrawer v-model:open="open" :title="title" direction="rigth">
    <UForm class="space-y-4 p-4" @submit="emit('submit')">
      <slot />
      <UButton type="submit" color="primary" block>{{ props.title.startsWith('Editar') ? 'Actualizar' : 'Crear' }}</UButton>
    </UForm>
  </AppDrawer>
</template>
