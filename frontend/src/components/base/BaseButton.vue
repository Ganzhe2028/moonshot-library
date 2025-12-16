<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    active?: boolean
    block?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    active: false,
    block: false,
  },
)

const handleDisabledClick = (event: MouseEvent) => {
  if (!props.disabled) return
  event.preventDefault()
  event.stopPropagation()
}
</script>

<template>
  <RouterLink
    v-if="to"
    :to="to"
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'is-active': active, 'is-block': block, 'is-disabled': disabled },
    ]"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? -1 : undefined"
    @click="handleDisabledClick"
    v-bind="$attrs"
  >
    <slot />
  </RouterLink>

  <a
    v-else-if="href"
    :href="href"
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'is-active': active, 'is-block': block, 'is-disabled': disabled },
    ]"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? -1 : undefined"
    @click="handleDisabledClick"
    v-bind="$attrs"
  >
    <slot />
  </a>

  <button
    v-else
    :type="type"
    :disabled="disabled"
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'is-active': active, 'is-block': block },
    ]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font: inherit;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  line-height: var(--line-snug);
  font-weight: var(--font-weight-semibold);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    filter 0.18s ease;
}

.base-button--sm {
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.base-button--md {
  padding: 0.55rem 0.95rem;
  font-size: var(--text-base);
}

.base-button--lg {
  padding: 0.85rem 1.4rem;
  min-height: 44px;
  font-size: var(--text-base);
}

.base-button--primary {
  background: var(--cta-gradient);
  color: #fff;
  box-shadow: 0 16px 32px var(--color-primary-soft);
}

.base-button--primary:hover:not(:disabled):not(.is-disabled) {
  transform: translateY(-1px);
  filter: brightness(0.985);
}

.base-button--primary:active:not(:disabled):not(.is-disabled) {
  transform: translateY(0);
}

.base-button--primary:disabled,
.base-button--primary.is-disabled {
  background: var(--color-primary-soft);
  color: var(--color-muted);
  box-shadow: none;
}

.base-button--secondary {
  background: var(--chip-bg);
  border-color: var(--color-border);
  color: var(--color-ink);
}

.base-button--secondary:hover:not(:disabled):not(.is-disabled) {
  border-color: var(--color-border-strong);
  filter: brightness(0.99);
}

.base-button--ghost {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-muted);
}

.base-button--ghost:hover:not(:disabled):not(.is-disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary-strong);
}

.base-button--ghost.is-active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-strong);
}

.base-button--danger {
  background: var(--color-danger-soft);
  border-color: rgba(199, 54, 47, 0.35);
  color: var(--color-danger-strong);
}

.base-button--danger:hover:not(:disabled):not(.is-disabled) {
  border-color: var(--color-danger);
  filter: brightness(0.98);
}

.base-button:focus-visible {
  outline: 3px solid var(--color-primary-soft);
  outline-offset: 2px;
}

.is-block {
  width: 100%;
}

.is-disabled {
  cursor: not-allowed;
  pointer-events: none;
}
</style>

