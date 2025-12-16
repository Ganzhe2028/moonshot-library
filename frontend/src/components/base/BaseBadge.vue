<script setup lang="ts">
type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info'
type BadgeSize = 'sm' | 'md'

withDefaults(
  defineProps<{
    variant?: BadgeVariant
    size?: BadgeSize
  }>(),
  {
    variant: 'neutral',
    size: 'md',
  },
)
</script>

<template>
  <span :class="['base-badge', `base-badge--${variant}`, `base-badge--${size}`]">
    <slot />
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  font-weight: var(--font-weight-semibold);
  border: 1px solid transparent;
  white-space: nowrap;
}

.base-badge--sm {
  padding: 0.2rem 0.6rem;
  font-size: var(--text-xs);
}

.base-badge--md {
  padding: 0.25rem 0.75rem;
  font-size: var(--text-sm);
}

.base-badge--neutral {
  background: rgba(30, 55, 65, 0.08);
  color: var(--color-ink);
  border-color: var(--color-border);
}

.base-badge--success {
  background: var(--color-success-soft);
  color: var(--color-success-strong);
  border-color: rgba(11, 138, 104, 0.35);
}

.base-badge--warning {
  background: var(--color-warning-soft);
  color: var(--color-warning-strong);
  border-color: rgba(194, 107, 5, 0.35);
}

.base-badge--error {
  background: var(--color-danger-soft);
  color: var(--color-danger-strong);
  border-color: rgba(199, 54, 47, 0.35);
}

.base-badge--info {
  background: var(--color-info-soft);
  color: var(--color-info-strong);
  border-color: rgba(31, 106, 165, 0.35);
}
</style>

