<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import BookCard from '@/components/BookCard.vue'
import { useLibraryStore } from '@/stores/library'
import { useAuthStore } from '@/stores/auth'
import type { Book, BorrowingRecord } from '@/types/library'

type StatusFilter = 'all' | 'available' | 'borrowed' | 'reserved'
type NextDuePayload = { record: BorrowingRecord; book: Book } | null

const authStore = useAuthStore()
const libraryStore = useLibraryStore()

const searchQuery = ref('')
const statusFilter = ref<StatusFilter>('all')
const filters: StatusFilter[] = ['all', 'available', 'borrowed', 'reserved']

const availableCount = computed(
  () => libraryStore.books.filter((book) => book.status === 'available').length,
)

const filteredBooks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return libraryStore.books.filter((book) => {
    const authors = (book.authors ?? []).join(' ').toLowerCase()
    const isbn = book.isbn?.toLowerCase() ?? ''
    const matchesQuery =
      query.length === 0 ||
      book.title.toLowerCase().includes(query) ||
      authors.includes(query) ||
      isbn.includes(query) ||
      book.category.toLowerCase().includes(query)

    const matchesStatus = statusFilter.value === 'all' || book.status === statusFilter.value

    return matchesQuery && matchesStatus
  })
})

const spotlightTags = computed(() => {
  const tags = new Set<string>()
  libraryStore.books.forEach((book) => (book.tags || []).forEach((tag) => tags.add(tag)))
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
  new Date(dateString).toLocaleDateString('zh-CN', {
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
})

watch(
  () => authStore.user?.id,
  () => {
    libraryStore.fetchBorrowings(true)
  },
)
</script>

<template>
  <div class="page">
    <section class="hero">
      <p class="eyebrow">Moonshot Library System</p>
      <h1>开启你的下一次阅读冒险</h1>
      <p class="subtitle">
        搜索图书、查看库存状态，并追踪你的借阅旅程。我们会为你保留每一次灵感。
      </p>

      <div class="search-card">
        <div class="search-input">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="搜索书名、作者、ISBN 或分类号"
          />
          <button type="button">搜索</button>
        </div>

        <div class="search-meta">
          <div>
            <p class="meta-eyebrow">馆藏总量</p>
            <p class="meta-value">{{ libraryStore.books.length }}</p>
          </div>
          <div>
            <p class="meta-eyebrow">今日可借</p>
            <p class="meta-value">{{ availableCount }}</p>
          </div>
          <RouterLink class="link" to="/borrowings">查看我的借阅 →</RouterLink>
        </div>
      </div>
    </section>

    <section class="status-panel" v-if="nextDue">
      <div class="status-badge">下一本到期</div>
      <div>
        <p class="status-title">{{ nextDue!.book.title }}</p>
        <p class="status-meta">
          {{ formatDate(nextDue!.record.dueDate) }} · 剩余
          <strong>{{ daysUntil(nextDue!.record.dueDate) }} 天</strong>
        </p>
      </div>
      <RouterLink class="status-action" to="/borrowings">管理借阅</RouterLink>
    </section>

    <section class="filters">
      <p>快速筛选</p>
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
              ? '全部'
              : filter === 'available'
                ? '可借阅'
                : filter === 'borrowed'
                  ? '借出中'
                  : '已预约'
          }}
        </button>
      </div>
    </section>

    <section class="book-grid">
      <BookCard v-for="book in filteredBooks" :key="book.id" :book="book" />
      <div v-if="filteredBooks.length === 0" class="empty-state">
        <p>没有找到对应的图书，可以尝试换个关键词。</p>
      </div>
    </section>

    <section class="tags" v-if="spotlightTags.length">
      <p class="tags-title">热门主题</p>
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
  font-size: 0.75rem;
  color: #8a8e99;
  margin-bottom: 0.5rem;
}

.hero h1 {
  font-size: clamp(2.2rem, 4vw, 3rem);
  margin: 0;
}

.subtitle {
  max-width: 640px;
  color: #4c4f59;
  margin-bottom: 1.8rem;
}

.search-card {
  background: #fff;
  border-radius: 24px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 17, 21, 0.05);
  box-shadow: 0 20px 55px rgba(15, 17, 21, 0.08);
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
  border-radius: 14px;
  border: 1px solid rgba(15, 17, 21, 0.08);
  background: rgba(244, 244, 248, 0.7);
}

.search-input button {
  background: linear-gradient(135deg, #4338ca, #6366f1);
  color: #fff;
  border-radius: 14px;
  padding: 0 1.5rem;
}

.search-meta {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.meta-eyebrow {
  font-size: 0.75rem;
  color: #8a8e99;
  margin: 0;
}

.meta-value {
  font-size: 1.8rem;
  margin: 0.2rem 0 0;
}

.link {
  color: #4338ca;
  font-weight: 600;
}

.status-panel {
  background: linear-gradient(120deg, #eef2ff, #f5f3ff);
  border-radius: 24px;
  padding: 1.4rem 1.8rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.status-badge {
  background: #fff;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-title {
  margin: 0;
  font-weight: 600;
}

.status-meta {
  margin: 0.2rem 0 0;
  color: #4c4f59;
}

.status-action {
  margin-left: auto;
  font-weight: 600;
  color: #4338ca;
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
  border: 1px solid rgba(15, 17, 21, 0.08);
  background: #fff;
  color: #4c4f59;
}

.chips button.active {
  border-color: rgba(99, 102, 241, 0.6);
  color: #1f1f25;
  background: rgba(99, 102, 241, 0.12);
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
  background: rgba(249, 250, 255, 0.8);
  text-align: center;
}

.tags {
  background: #fff;
  border-radius: 24px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 17, 21, 0.05);
}

.tags-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-weight: 600;
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.tag-grid span {
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: rgba(15, 17, 21, 0.05);
  font-size: 0.85rem;
  color: #1f1f25;
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
