<script setup lang="ts">
import type { MenuItem } from '~/stores/permisos.store'
import { isPathActive, nodeContainsActive } from '~/utils/menu-tree'

defineOptions({ name: 'MenuTreeItem' })

type Node = MenuItem & { id?: number | string }

const props = withDefaults(defineProps<{
  node: Node
  depth?: number
  variant?: 'sidebar' | 'submenu'
}>(), {
  depth: 0,
  variant: 'sidebar',
})

const route = useRoute()

const children = computed<Node[]>(() => (props.node.children ?? []) as Node[])
const hasChildren = computed(() => children.value.length > 0)

const open = ref(false)
const syncOpen = (path: string) => {
  if (nodeContainsActive(props.node, path)) open.value = true
}
syncOpen(route.path)
watch(() => route.path, syncOpen)

const selfActive = computed(() => isPathActive(props.node.to, route.path))
const childActive = computed(() => children.value.some(c => nodeContainsActive(c, route.path)))

const toggle = () => { open.value = !open.value }

const rowBase = 'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full text-left'
const leafClass = computed(() => props.variant === 'submenu'
  ? 'hover:bg-muted text-muted'
  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5')
const activeClass = computed(() => props.variant === 'submenu'
  ? 'bg-primary/10 text-primary font-semibold'
  : 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-semibold')
</script>

<template>
  <div>
    <template v-if="hasChildren">
      <div class="flex items-center gap-1">
        <ULink
          v-if="node.to"
          :to="node.to"
          :active="selfActive"
          :active-class="activeClass"
          :class="[rowBase, leafClass, 'flex-1 min-w-0']"
        >
          <UIcon v-if="node.icon" :name="node.icon" class="size-4 shrink-0" />
          <span class="truncate">{{ node.label }}</span>
        </ULink>
        <button
          v-else
          type="button"
          :class="[rowBase, leafClass, 'flex-1 min-w-0 cursor-pointer', childActive && 'font-semibold']"
          @click="toggle"
        >
          <UIcon v-if="node.icon" :name="node.icon" class="size-4 shrink-0" />
          <span class="truncate">{{ node.label }}</span>
        </button>
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          square
          :icon="'i-lucide-chevron-down'"
          :ui="{ base: 'shrink-0 transition-transform' }"
          :class="!open && '-rotate-90'"
          :aria-expanded="open"
          :aria-label="open ? `Contraer ${node.label}` : `Expandir ${node.label}`"
          @click="toggle"
        />
      </div>
      <div v-show="open" class="ml-3 mt-0.5 border-l border-neutral-200 dark:border-white/10 pl-1.5 flex flex-col gap-0.5">
        <MenuTreeItem
          v-for="child in children"
          :key="child.id ?? child.to ?? child.label"
          :node="child"
          :depth="depth + 1"
          :variant="variant"
        />
      </div>
    </template>

    <ULink
      v-else-if="node.to"
      :to="node.to"
      :active="selfActive"
      :active-class="activeClass"
      :class="[rowBase, leafClass]"
    >
      <UIcon v-if="node.icon" :name="node.icon" class="size-4 shrink-0" />
      <span class="truncate">{{ node.label }}</span>
    </ULink>
  </div>
</template>
