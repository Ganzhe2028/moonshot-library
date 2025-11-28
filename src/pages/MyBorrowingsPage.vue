<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'
import type { BorrowingRecord } from '@/types/library'

const authStore = useAuthStore()
const libraryStore = useLibraryStore()
const { t, locale } = useI18n()

const currentUser = computed(() => authStore.user)
const isLoggedIn = computed(() => !!currentUser.value)
const actionMessage = ref('')
const actionVariant = ref<'success' | 'error'>('success')

const activeBorrowings = computed(() =>
  libraryStore.activeBorrowings.map((record: BorrowingRecord) => ({
    record,
    book: libraryStore.getBookById(record.bookId),
  })),
)

const historyRecords = computed(() =>
  libraryStore.borrowingHistory.map((record: BorrowingRecord) => ({
    record,
    book: libraryStore.getBookById(record.bookId),
  })),
)

const summaryCards = computed(() => [
  {
    label: t('borrowings.currentTab'),
    value: libraryStore.activeBorrowings.length,
    hint: t('borrowings.current'),
  },
  {
    label: t('home.filterAvailable'),
    value: libraryStore.books.filter((book) => book.status === 'available').length,
    hint: t('home.available'),
  },
  {
    label: t('borrowings.historyTab'),
    value: libraryStore.borrowingHistory.length,
    hint: t('borrowings.noHistory'),
  },
  {
    label: '总阅读字数',
    value: currentUser.value?.total_words_read || 0,
    hint: '累计阅读',
  },
])

const userInitials = computed(() => {
  const name = currentUser.value?.name?.trim() ?? ''
  if (!name) return ''

  const parts = name.split(/\s+/).filter(Boolean)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
  return initials || name[0]?.toUpperCase() || ''
})

const avatarStyle = computed(() => ({
  backgroundColor: currentUser.value?.avatarColor || '#8b5cf6',
  color: '#fff',
}))

const formatDate = (dateString?: string) =>
  dateString
    ? new Date(dateString).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
        month: 'short',
        day: 'numeric',
      })
    : '--'

const daysUntil = (dateString: string) => {
  const today = new Date()
  const target = new Date(dateString)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const dueLabel = (dateString: string) => {
  const diff = daysUntil(dateString)
  if (diff < 0) return `${t('admin.borrowings.overdue')} · ${Math.abs(diff)}`
  if (diff === 0) return t('borrowings.dueDate')
  if (diff <= 3) return `${t('borrowings.dueDate')} · ${diff}`
  return t('home.remainingDays', { days: diff })
}

const formatAuthors = (authors?: string[]) => (authors?.length ? authors.join(' / ') : '--')

const formatWordCount = (count?: number): string => {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  return count.toString()
}

const requireAuth = () => {
  if (!authStore.user) {
    actionVariant.value = 'error'
    actionMessage.value = t('borrowings.loginHint')
    return false
  }
  return true
}

const handleRenew = async (recordId: string) => {
  if (!requireAuth()) return
  const result = await libraryStore.renewBorrowing(recordId)
  actionVariant.value = result.success ? 'success' : 'error'
  actionMessage.value = result.message
}

const handleReturn = async (recordId: string) => {
  if (!requireAuth()) return
  const result = await libraryStore.returnBook(recordId)
  actionVariant.value = result.success ? 'success' : 'error'
  actionMessage.value = result.message
}

onMounted(() => {
  libraryStore.fetchBooks()
  libraryStore.fetchBorrowings()
})

watch(
  () => currentUser.value?.id,
  () => {
    libraryStore.fetchBorrowings(true)
  },
)
</script>

<template>
  <div class="page">
    <section v-if="isLoggedIn" class="profile">
      <div class="avatar" :style="avatarStyle">
        {{ userInitials }}
      </div>
      <div>
        <p class="eyebrow">{{ t('common.borrowings') }}</p>
        <h1>{{ currentUser!.name }}</h1>
        <p class="meta">
          {{ currentUser!.email }}
          <template v-if="currentUser!.membership"> · {{ currentUser!.membership }} </template>
          <template v-if="currentUser!.grade"> · {{ currentUser!.grade }} </template>
        </p>
      </div>
    </section>
    <section v-else class="profile not-logged">
      <div>
        <p class="eyebrow">{{ t('borrowings.loginHintTitle') }}</p>
        <h1>{{ t('borrowings.loginHint') }}</h1>
        <router-link class="primary" to="/login">{{ t('auth.login') }}</router-link>
      </div>
    </section>

    <section class="summary">
      <div v-for="card in summaryCards" :key="card.label" class="summary-card">
        <p class="label">{{ card.label }}</p>
        <p class="value">{{ card.value }}</p>
        <p class="hint">{{ card.hint }}</p>
      </div>
    </section>

    <p v-if="actionMessage" :class="['action-message', actionVariant]">{{ actionMessage }}</p>

    <section class="borrowings" v-if="isLoggedIn">
      <div class="section-header">
        <div>
          <p class="eyebrow">{{ t('borrowings.currentTab') }}</p>
          <h2>{{ t('borrowings.current') }}</h2>
        </div>
      </div>

      <div v-if="activeBorrowings.length" class="borrowing-grid">
        <article v-for="item in activeBorrowings" :key="item.record.id" class="borrowing-card">
          <div class="card-head">
            <p class="book-title">{{ item.book?.title }}</p>
            <span class="due" :class="{ warning: daysUntil(item.record.dueDate) <= 3 }">
              {{ dueLabel(item.record.dueDate) }}
            </span>
          </div>
          <p class="book-author">{{ formatAuthors(item.book?.authors) }}</p>
          <p class="book-meta">
            {{ t('buttons.borrow') }}：{{ formatDate(item.record.borrowDate) }} · {{ t('borrowings.dueDate') }}：
            {{ formatDate(item.record.dueDate) }}
          </p>
          <div class="actions">
            <button type="button" class="secondary" @click="handleReturn(item.record.id)">
              {{ t('borrowings.return') }}
            </button>
            <button type="button" class="primary" @click="handleRenew(item.record.id)">
              {{ t('borrowings.renew') }}
            </button>
          </div>
          <p class="renewals">
            {{ t('borrowings.renewTip') }} ({{ item.record.renewals }} / 2)
          </p>
        </article>
      </div>
      <div v-else class="empty-state">
        <p>{{ t('borrowings.noActive') }}</p>
      </div>
    </section>
    <section v-else class="borrowings">
      <div class="empty-state">
        <p>{{ t('borrowings.loginHint') }}</p>
        <router-link class="primary" to="/login">{{ t('auth.login') }}</router-link>
      </div>
    </section>

    <section class="history" v-if="isLoggedIn">
      <div class="section-header">
        <div>
          <p class="eyebrow">{{ t('borrowings.historyTab') }}</p>
          <h2>{{ t('borrowings.historyTab') }}</h2>
        </div>
      </div>

      <div v-if="historyRecords.length" class="history-list">
        <article v-for="item in historyRecords" :key="item.record.id">
          <div>
            <p class="book-title">{{ item.book?.title }}</p>
            <p class="book-author">{{ formatAuthors(item.book?.authors) }}</p>
          </div>
          <p class="book-meta">
            {{ formatDate(item.record.borrowDate) }} — {{ formatDate(item.record.returnDate) }}
          </p>
          <p class="word-count">阅读字数：{{ formatWordCount(item.book?.word_count) }}字</p>
          <span class="status-pill">{{ t('buttons.borrowed') }}</span>
        </article>
      </div>
      <div v-else class="empty-state">
        <p>{{ t('borrowings.noHistory') }}</p>
      </div>
    </section>
    <section v-else class="history">
      <div class="empty-state">
        <p>{{ t('borrowings.loginHint') }}</p>
        <router-link class="primary" to="/login">{{ t('auth.login') }}</router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  padding: 1rem 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile {
  display: flex;
  gap: 1rem;
  background: #fff;
  padding: 1.5rem;
  border-radius: 24px;
  border: 1px solid rgba(15, 17, 21, 0.05);
  align-items: center;
}

.profile.not-logged {
  justify-content: center;
  text-align: center;
}

.avatar {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.meta {
  color: #4c4f59;
  margin: 0.4rem 0 0;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: #fff;
  border-radius: 20px;
  padding: 1.2rem;
  border: 1px solid rgba(15, 17, 21, 0.05);
}

.summary-card .label {
  font-size: 0.85rem;
  color: #6c6f78;
  margin: 0;
}

.summary-card .value {
  font-size: 2rem;
  margin: 0.4rem 0;
}

.summary-card .hint {
  margin: 0;
  color: #8a8e99;
}

.action-message {
  padding: 0.8rem 1rem;
  border-radius: 16px;
  text-align: center;
}

.action-message.success {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.action-message.error {
  background: rgba(251, 191, 36, 0.2);
  color: #92400e;
}

.borrowings,
.history {
  background: #fff;
  border-radius: 24px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 17, 21, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.borrowing-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.borrowing-card {
  border: 1px solid rgba(15, 17, 21, 0.05);
  border-radius: 20px;
  padding: 1.2rem;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.book-title {
  margin: 0;
  font-weight: 600;
}

.book-author {
  margin: 0.2rem 0;
  color: #4c4f59;
}

.book-meta {
  margin: 0;
  color: #8a8e99;
}

.due {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: rgba(99, 102, 241, 0.12);
  color: #312e81;
}

.due.warning {
  background: rgba(248, 113, 113, 0.16);
  color: #991b1b;
}

.actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.9rem;
}

.primary,
.secondary {
  border-radius: 14px;
  padding: 0.65rem 1rem;
}

.primary {
  background: linear-gradient(120deg, #4338ca, #6366f1);
  color: white;
}

.secondary {
  background: rgba(15, 17, 21, 0.06);
  color: #1f1f25;
}

.renewals {
  margin: 0.8rem 0 0;
  font-size: 0.9rem;
  color: #6c6f78;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  border-radius: 18px;
  background: rgba(249, 250, 255, 0.8);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-list article {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgba(15, 17, 21, 0.05);
}

.history-list article:last-child {
  border-bottom: none;
}

.status-pill {
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
  font-size: 0.85rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .profile {
    flex-direction: column;
    align-items: flex-start;
  }

  .borrowing-card {
    padding: 1rem;
  }

  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
