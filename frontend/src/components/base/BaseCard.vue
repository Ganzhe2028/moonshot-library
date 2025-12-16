<script setup lang="ts">
type CardPadding = 'none' | 'sm' | 'md' | 'lg'
type CardRadius = 'sm' | 'md' | 'lg' | 'xl'
type CardSurface = 'default' | 'soft'
type CardShadow = 'none' | 'soft'

withDefaults(
  defineProps<{
    padding?: CardPadding
    radius?: CardRadius
    surface?: CardSurface
    shadow?: CardShadow
  }>(),
  {
    padding: 'md',
    radius: 'xl',
    surface: 'default',
    shadow: 'soft',
  },
)
</script>

<template>
  <div
    :class="[
      'base-card',
      `base-card--padding-${padding}`,
      `base-card--radius-${radius}`,
      `base-card--surface-${surface}`,
      `base-card--shadow-${shadow}`,
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.base-card {
  border: 1px solid var(--color-border);
}

.base-card--surface-default {
  background: var(--color-surface);
}

.base-card--surface-soft {
  background: var(--color-surface-soft);
}

.base-card--shadow-soft {
  box-shadow: var(--shadow-soft);
}

.base-card--shadow-none {
  box-shadow: none;
}

.base-card--radius-sm {
  border-radius: var(--radius-sm);
}

.base-card--radius-md {
  border-radius: var(--radius-md);
}

.base-card--radius-lg {
  border-radius: var(--radius-lg);
}

.base-card--radius-xl {
  border-radius: var(--radius-xl);
}

.base-card--padding-none {
  padding: 0;
}

.base-card--padding-sm {
  padding: 1rem;
}

.base-card--padding-md {
  padding: 1.5rem;
}

.base-card--padding-lg {
  padding: 2rem;
}
</style>

