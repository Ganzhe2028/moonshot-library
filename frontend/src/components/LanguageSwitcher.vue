<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { setLocale } from '@/i18n'

const { locale, t } = useI18n()

const options = [
  { value: 'zh', labelKey: 'language.zh' },
  { value: 'en', labelKey: 'language.en' },
]

const current = computed(() => locale.value)

const changeLocale = (value: string) => {
  locale.value = value
  setLocale(value as 'zh' | 'en')
}
</script>

<template>
  <div class="switcher" role="group" aria-label="Language switcher">
    <span class="label">{{ t('language.label') }}:</span>
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="['pill', { active: current === option.value }]"
      @click="changeLocale(option.value)"
    >
      {{ t(option.labelKey) }}
    </button>
  </div>
  </template>

<style scoped>
.switcher {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--text-sm);
}

.label {
  color: var(--color-subtle);
}

.pill {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: 0.35rem 0.65rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: var(--font-weight-semibold);
}

.pill.active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-ink);
}
</style>
