<script setup lang="ts">
import { computed } from 'vue'

type AlertVariant = 'success' | 'error' | 'info' | 'warning'

const props = withDefaults(
  defineProps<{
    variant?: AlertVariant
  }>(),
  {
    variant: 'info',
  },
)

const role = computed(() => (props.variant === 'error' ? 'alert' : 'status'))
</script>

<template>
  <div :class="['base-alert', `base-alert--${variant}`]" :role="role">
    <slot />
  </div>
</template>

<style scoped>
.base-alert {
  padding: 0.8rem 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  font-size: var(--text-sm);
  line-height: var(--line-relaxed);
}

.base-alert--success {
  background: var(--color-success-soft);
  color: var(--color-success-strong);
  border-color: rgba(11, 138, 104, 0.28);
}

.base-alert--error {
  background: var(--color-danger-soft);
  color: var(--color-danger-strong);
  border-color: rgba(199, 54, 47, 0.28);
}

.base-alert--warning {
  background: var(--color-warning-soft);
  color: var(--color-warning-strong);
  border-color: rgba(194, 107, 5, 0.28);
}

.base-alert--info {
  background: var(--color-info-soft);
  color: var(--color-info-strong);
  border-color: rgba(31, 106, 165, 0.28);
}
</style>

