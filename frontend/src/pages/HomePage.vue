<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import BookCard from '@/components/BookCard.vue'
import { useLibraryStore } from '@/stores/library'
import { useAuthStore } from '@/stores/auth'
import type { Book, BorrowingRecord } from '@/types/library'

type StatusFilter = 'all' | 'available' | 'borrowed' | 'reserved'
type NextDuePayload = { record: BorrowingRecord; book: Book } | null

const authStore = useAuthStore()
const libraryStore = useLibraryStore()
const { t, locale } = useI18n()

const searchQuery = ref('')
const statusFilter = ref<StatusFilter>('all')
const filters: StatusFilter[] = ['all', 'available', 'borrowed', 'reserved']

const localizedTitle = (book: Book) =>
  locale.value === 'en' && book.titleEn ? book.titleEn : book.title

const localizedAuthors = (book: Book) =>
  locale.value === 'en' && book.authorsEn?.length ? book.authorsEn : book.authors || []

const localizedCategory = (book: Book) =>
  locale.value === 'en' && book.categoryEn ? book.categoryEn : book.category

const localizedPublisher = (book: Book) =>
  locale.value === 'en' && book.publisherEn ? book.publisherEn : book.publisher || ''

const localizedDescription = (book: Book) =>
  locale.value === 'en' && book.descriptionEn ? book.descriptionEn : book.description || ''

const localizedTags = (book: Book) =>
  locale.value === 'en' && book.tagsEn?.length ? book.tagsEn : book.tags || []

const borrowableCount = computed(() => libraryStore.remainingBorrowingQuota)

const filteredBooks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return libraryStore.books.filter((book) => {
    const authors = localizedAuthors(book).join(' ').toLowerCase()
    const isbn = book.isbn?.toLowerCase() ?? ''
    const title = localizedTitle(book).toLowerCase()
    const category = localizedCategory(book).toLowerCase()
    const publisher = localizedPublisher(book).toLowerCase()
    const description = localizedDescription(book).toLowerCase()
    const location = book.location?.toLowerCase() ?? ''
    const publishedYear = book.publishedYear ? String(book.publishedYear) : ''
    const status = book.status?.toLowerCase() ?? ''
    const tags = localizedTags(book).map((tag) => tag.toLowerCase())
    const matchesQuery =
      query.length === 0 ||
      title.includes(query) ||
      authors.includes(query) ||
      isbn.includes(query) ||
      category.includes(query) ||
      publisher.includes(query) ||
      description.includes(query) ||
      location.includes(query) ||
      publishedYear.includes(query) ||
      status.includes(query) ||
      tags.some((tag) => tag.includes(query))

    const matchesStatus = statusFilter.value === 'all' || book.status === statusFilter.value

    return matchesQuery && matchesStatus
  })
})

const spotlightTags = computed(() => {
  const tags = new Set<string>()
  libraryStore.books.forEach((book) => localizedTags(book).forEach((tag) => tags.add(tag)))
  return Array.from(tags).slice(0, 6)
})

const nextDue = computed<NextDuePayload>(() => {
  if (!libraryStore.activeBorrowings.length) return null
  const sorted = [...libraryStore.activeBorrowings].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )
  const record = sorted[0]
  const book = record ? libraryStore.getBookById(record.bookId) : undefined

  if (!record || !book) return null
  return { record, book }
})

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    month: 'short',
    day: 'numeric',
  })

const daysUntil = (dateString: string) => {
  const today = new Date()
  const target = new Date(dateString)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

onMounted(() => {
  libraryStore.fetchBooks()
  libraryStore.fetchBorrowings()
  libraryStore.fetchFavorites()
  libraryStore.fetchBorrowingLimit()
})

watch(
  () => authStore.user?.id,
  () => {
    libraryStore.fetchBorrowings(true)
    libraryStore.fetchFavorites(true)
  },
)
</script>

<template>
  <div class="page">
    <section class="hero">
      <p class="eyebrow">{{ t('home.eyebrow') }}</p>
      <h1>{{ t('home.title') }}</h1>
      <p class="subtitle">
        {{ t('home.subtitle') }}
      </p>

      <div class="search-card">
        <div class="search-input">
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('home.searchPlaceholder')"
          />
          <button type="button">{{ t('home.search') }}</button>
        </div>

        <div class="search-meta">
          <div>
            <p class="meta-eyebrow">{{ t('home.total') }}</p>
            <p class="meta-value">{{ libraryStore.books.length }}</p>
          </div>
          <div>
            <p class="meta-eyebrow">{{ t('home.available') }}</p>
            <p class="meta-value">{{ borrowableCount }}</p>
          </div>
          <RouterLink class="link" to="/borrowings">{{ t('home.viewBorrowings') }}</RouterLink>
        </div>
      </div>
    </section>

    <section class="status-panel" v-if="nextDue">
      <div class="status-badge">{{ t('home.nextDue') }}</div>
      <div>
        <p class="status-title">{{ localizedTitle(nextDue!.book) }}</p>
        <p class="status-meta">
          {{ formatDate(nextDue!.record.dueDate) }} ·
          <strong>{{ t('home.remainingDays', { days: daysUntil(nextDue!.record.dueDate) }) }}</strong>
        </p>
      </div>
      <RouterLink class="status-action" to="/borrowings">{{ t('home.manageBorrowings') }}</RouterLink>
    </section>

    <section class="filters">
      <p>{{ t('home.quickFilter') }}</p>
      <div class="chips">
        <button
          v-for="filter in filters"
          :key="filter"
          type="button"
          :class="{ active: statusFilter === filter }"
          @click="statusFilter = filter"
        >
          {{
            filter === 'all'
              ? t('home.filterAll')
              : filter === 'available'
                ? t('home.filterAvailable')
                : filter === 'borrowed'
                  ? t('home.filterBorrowed')
                  : t('home.filterReserved')
          }}
        </button>
      </div>
    </section>

    <section class="book-grid">
      <BookCard v-for="book in filteredBooks" :key="book.id" :book="book" />
      <div v-if="filteredBooks.length === 0" class="empty-state">
        <p>{{ t('home.empty') }}</p>
      </div>
    </section>

    <section class="tags" v-if="spotlightTags.length">
      <p class="tags-title">{{ t('home.hotTags') }}</p>
      <div class="tag-grid">
        <span v-for="tag in spotlightTags" :key="tag">{{ tag }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
}

.hero {
  padding: 3rem 0 1rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: var(--text-xs);
  color: var(--color-subtle);
  margin-bottom: 0.5rem;
}

.hero h1 {
  font-size: var(--text-display);
  margin: 0;
  color: var(--color-ink);
}

.subtitle {
  max-width: 640px;
  color: var(--color-muted);
  margin-bottom: 1.6rem;
  font-size: var(--text-md);
}

.search-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.search-input {
  display: flex;
  gap: 0.5rem;
}

.search-input input {
  flex: 1;
  padding: 0.9rem 1.2rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface-soft);
  color: var(--color-ink);
}

.search-input button {
  background: var(--cta-gradient);
  color: #fff;
  border-radius: var(--radius-md);
  padding: 0 1.5rem;
  box-shadow: 0 12px 28px var(--color-primary-soft);
}

.search-meta {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.meta-eyebrow {
  font-size: var(--text-xs);
  color: var(--color-subtle);
  margin: 0;
}

.meta-value {
  font-size: 1.8rem;
  margin: 0.2rem 0 0;
}

.link {
  color: var(--color-primary);
  font-weight: 600;
}

.status-panel {
  background: var(--panel-gradient);
  border-radius: var(--radius-xl);
  padding: 1.4rem 1.8rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  border: 1px solid var(--color-border);
}

.status-badge {
  background: var(--color-surface);
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  font-size: var(--text-sm);
  font-weight: 600;
}

.status-title {
  margin: 0;
  font-weight: 600;
  color: var(--color-ink);
}

.status-meta {
  margin: 0.2rem 0 0;
  color: var(--color-muted);
}

.status-action {
  margin-left: auto;
  font-weight: 600;
  color: var(--color-primary);
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.chips {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.chips button {
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
  transition: all 0.2s ease;
}

.chips button.active {
  border-color: var(--color-primary);
  color: var(--color-ink);
  background: var(--chip-active);
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 2rem;
  border-radius: 20px;
  background: var(--color-surface-soft);
  text-align: center;
  color: var(--color-muted);
}

.tags {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

.tags-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--color-ink);
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.tag-grid span {
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: var(--tag-bg);
  font-size: var(--text-sm);
  color: var(--tag-text);
}

@media (max-width: 768px) {
  .search-input {
    flex-direction: column;
  }

  .search-input button {
    width: 100%;
    padding: 0.9rem;
  }

  .status-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-action {
    margin-left: 0;
  }
}
</style>
