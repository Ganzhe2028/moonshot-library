<script setup lang="ts">
type PanelPadding = 'none' | 'sm' | 'md' | 'lg'
type PanelRadius = 'sm' | 'md' | 'lg' | 'xl'
type PanelSurface = 'default' | 'soft'
type PanelShadow = 'none' | 'soft'
type PanelTag = 'section' | 'div' | 'article' | 'aside'

withDefaults(
  defineProps<{
    as?: PanelTag
    padding?: PanelPadding
    radius?: PanelRadius
    surface?: PanelSurface
    shadow?: PanelShadow
  }>(),
  {
    as: 'section',
    padding: 'md',
    radius: 'xl',
    surface: 'default',
    shadow: 'soft',
  },
)
</script>

<template>
  <component
    :is="as"
    :class="[
      'base-panel',
      `base-panel--padding-${padding}`,
      `base-panel--radius-${radius}`,
      `base-panel--surface-${surface}`,
      `base-panel--shadow-${shadow}`,
    ]"
  >
    <slot />
  </component>
</template>

<style scoped>
.base-panel {
  border: 1px solid var(--color-border);
}

.base-panel--surface-default {
  background: var(--color-surface);
}

.base-panel--surface-soft {
  background: var(--color-surface-soft);
}

.base-panel--shadow-soft {
  box-shadow: var(--shadow-soft);
}

.base-panel--shadow-none {
  box-shadow: none;
}

.base-panel--radius-sm {
  border-radius: var(--radius-sm);
}

.base-panel--radius-md {
  border-radius: var(--radius-md);
}

.base-panel--radius-lg {
  border-radius: var(--radius-lg);
}

.base-panel--radius-xl {
  border-radius: var(--radius-xl);
}

.base-panel--padding-none {
  padding: 0;
}

.base-panel--padding-sm {
  padding: 1rem;
}

.base-panel--padding-md {
  padding: 1.5rem;
}

.base-panel--padding-lg {
  padding: 2rem;
}
</style>
