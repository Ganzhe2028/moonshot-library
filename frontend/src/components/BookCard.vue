<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import type { Book } from '@/types/library'

const props = defineProps<{
  book: Book
}>()

const { t, locale } = useI18n()

const statusLabel = computed(() => {
  const map: Record<string, { text: string; className: string }> = {
    available: { text: t('bookCard.status.available'), className: 'available' },
    borrowed: { text: t('bookCard.status.borrowed'), className: 'borrowed' },
    reserved: { text: t('bookCard.status.reserved'), className: 'reserved' },
    maintenance: { text: t('bookCard.status.maintenance'), className: 'reserved' },
  }

  return map[props.book.status]
})

const localizedTitle = computed(() =>
  locale.value === 'en' && props.book.titleEn ? props.book.titleEn : props.book.title,
)

const localizedCategory = computed(() =>
  locale.value === 'en' && props.book.categoryEn ? props.book.categoryEn : props.book.category,
)

const localizedTags = computed(
  () => (locale.value === 'en' && props.book.tagsEn?.length ? props.book.tagsEn : props.book.tags || []),
)

const authorLine = computed(() => {
  const authors =
    locale.value === 'en' && props.book.authorsEn?.length ? props.book.authorsEn : props.book.authors
  if (!authors?.length) return t('empty.noData')
  return authors.join(' / ')
})

const coverImageUrl = computed(
  () =>
    props.book.coverImage ||
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
)
</script>

<template>
  <RouterLink :to="`/books/${book.id}`" class="card">
    <div class="cover" :style="{ backgroundImage: `url(${coverImageUrl})` }" />
    <div class="info">
      <div class="category-status-container">
        <p class="category">{{ localizedCategory }}</p>
        <span class="status" :class="statusLabel?.className">{{ statusLabel?.text }}</span>
      </div>
      <h3>{{ localizedTitle }}</h3>
      <p class="author">{{ authorLine }}</p>

      <div class="tags">
        <span v-for="tag in localizedTags" :key="tag">{{ tag }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.category-status-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 0.5rem;
}

.status {
  font-size: 0.8rem;
  padding: 6px 12px;
  min-width: 80px;
  width: fit-content;
  text-align: center;
  white-space: nowrap;
  border-radius: 999px;
  font-weight: 600;
  z-index: 10;
  flex-shrink: 0;
}

.status.available {
  background: var(--status-available-bg);
  color: var(--status-available-text);
  border: 1px solid var(--status-available-text);
}

.status.borrowed {
  background: var(--status-danger-bg);
  color: var(--status-danger-text);
  border: 1px solid var(--status-danger-text);
}

.status.reserved {
  background: var(--status-warning-bg);
  color: var(--status-warning-text);
  border: 1px solid var(--status-warning-text);
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-strong);
}

.cover {
  border-radius: 16px;
  height: 180px;
  background-size: cover;
  background-position: center;
}

.info h3 {
  margin: 0.2rem 0;
  font-size: 1.05rem;
}

.category {
  font-size: 0.75rem;
  color: var(--color-subtle);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.author {
  margin: 0;
  color: var(--color-muted);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.tags span {
  background: var(--tag-bg);
  color: var(--tag-text);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
}
</style>
