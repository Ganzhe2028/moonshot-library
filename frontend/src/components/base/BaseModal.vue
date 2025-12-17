<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'

type ModalSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    size?: ModalSize
    closeOnBackdrop?: boolean
    closeOnEsc?: boolean
    showClose?: boolean
  }>(),
  {
    title: '',
    size: 'md',
    closeOnBackdrop: true,
    closeOnEsc: true,
    showClose: true,
  },
)

const emit = defineEmits<{
  close: []
}>()

const close = () => emit('close')

const onKeydown = (event: KeyboardEvent) => {
  if (!props.open || !props.closeOnEsc) return
  if (event.key === 'Escape') close()
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})

const sizeClass = computed(() => `base-modal--${props.size}`)

const onBackdropClick = () => {
  if (!props.closeOnBackdrop) return
  close()
}
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="base-modal__overlay" @click="onBackdropClick">
      <div class="base-modal" :class="sizeClass" role="dialog" aria-modal="true" @click.stop>
        <header v-if="title || $slots.header || showClose" class="base-modal__header">
          <slot name="header">
            <h3 class="base-modal__title">{{ title }}</h3>
          </slot>
          <button
            v-if="showClose"
            type="button"
            class="base-modal__close"
            aria-label="Close"
            @click="close"
          >
            ×
          </button>
        </header>

        <div class="base-modal__body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="base-modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.base-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 17, 21, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.base-modal {
  width: min(92vw, 560px);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-strong);
  overflow: hidden;
}

.base-modal--sm {
  width: min(92vw, 440px);
}

.base-modal--md {
  width: min(92vw, 560px);
}

.base-modal--lg {
  width: min(92vw, 760px);
}

.base-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.4rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.base-modal__title {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-ink);
}

.base-modal__close {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-subtle);
  font-size: 1.4rem;
  line-height: 1;
}

.base-modal__close:hover {
  border-color: var(--color-border);
  background: var(--chip-bg);
  color: var(--color-ink);
}

.base-modal__close:focus-visible {
  outline: 3px solid var(--color-primary-soft);
  outline-offset: 2px;
}

.base-modal__body {
  padding: 1.4rem;
}

.base-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.4rem 1.4rem;
}
</style>

