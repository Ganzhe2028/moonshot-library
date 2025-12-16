<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    modelModifiers?: { number?: boolean; trim?: boolean }
    type?: string
    disabled?: boolean
  }>(),
  {
    modelValue: '',
    modelModifiers: () => ({}),
    type: 'text',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const coerceValue = (raw: string) => {
  const trimmed = props.modelModifiers.trim ? raw.trim() : raw
  if (props.modelModifiers.number || props.type === 'number') {
    if (trimmed === '') return ''
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : trimmed
  }
  return trimmed
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', coerceValue(target?.value ?? ''))
}
</script>

<template>
  <input
    class="base-input"
    :type="type"
    :value="modelValue ?? ''"
    :disabled="disabled"
    @input="handleInput"
    v-bind="$attrs"
  />
</template>

<style scoped>
.base-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: var(--text-base);
  background: var(--color-surface-soft);
  color: var(--color-ink);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.base-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.base-input:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}
</style>

