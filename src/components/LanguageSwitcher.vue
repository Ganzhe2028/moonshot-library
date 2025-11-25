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
  font-size: 0.9rem;
}

.label {
  color: #4c4f59;
}

.pill {
  border: 1px solid rgba(15, 17, 21, 0.1);
  background: #fff;
  border-radius: 10px;
  padding: 0.35rem 0.65rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.pill.active {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.4);
  color: #312e81;
}
</style>
