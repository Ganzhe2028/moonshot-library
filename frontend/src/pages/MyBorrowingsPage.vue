<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseAlert from '@/components/base/BaseAlert.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BasePanel from '@/components/base/BasePanel.vue'
import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'
import type { Book, BorrowingRecord } from '@/types/library'

const authStore = useAuthStore()
const libraryStore = useLibraryStore()
const { t, locale } = useI18n()

const currentUser = computed(() => authStore.user)
const isLoggedIn = computed(() => !!currentUser.value)
const actionMessage = ref('')
const actionVariant = ref<'success' | 'error' | 'warning'>('success')

const favoritesLoading = computed(() => libraryStore.favoritesLoading)

const MAX_RENEWALS = 2

const favoriteBooks = computed(() => {
  if (!libraryStore.favorites.length) return []
  return libraryStore.favorites
    .map((fav) => libraryStore.getBookById(fav.bookId))
    .filter((book): book is Book => Boolean(book))
})

const credit = computed(() => libraryStore.credit)

const scoreToLevel = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'warn'
  return 'suspended'
}

const creditSummary = computed(() => {
  const overdueCount = libraryStore.borrowings.filter((b) => b.status === 'overdue').length
  const membershipLabel =
    currentUser.value?.membership === 'active'
      ? t('admin.users.membershipActive')
      : t('admin.users.membershipSuspended')

  const score = credit.value?.score ?? 100
  const levelKey = credit.value?.level ?? scoreToLevel(score)
  const levelText =
    levelKey === 'excellent'
      ? t('borrowings.credit.levelExcellent')
      : levelKey === 'good'
        ? t('borrowings.credit.levelGood')
        : levelKey === 'warn'
          ? t('borrowings.credit.levelWarn')
          : t('borrowings.credit.status.suspended')
  const tip =
    levelKey === 'warn' || levelKey === 'suspended'
      ? t('borrowings.credit.tipWarn')
      : t('borrowings.credit.tipGood')

  return {
    score,
    levelKey,
    levelText,
    overdueCount,
    membership: `${t('borrowings.credit.membership')} · ${membershipLabel}`,
    tip,
    status: credit.value?.status || 'active',
  }
})

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

const remainingBorrowingQuota = computed(() => libraryStore.remainingBorrowingQuota)

const summaryCards = computed(() => [
  {
    label: t('borrowings.currentTab'),
    value: libraryStore.activeBorrowings.length,
    hint: t('borrowings.current'),
  },
  {
    label: t('borrowings.limitLabel'),
    value: remainingBorrowingQuota.value,
    hint: t('borrowings.limitHint', { count: libraryStore.borrowingLimit }),
  },
  {
    label: t('borrowings.historyTab'),
    value: libraryStore.borrowingHistory.length,
    hint: t('borrowings.noHistory'),
  },
  {
    label: t('borrowings.stats.totalWords'),
    value: currentUser.value?.total_words_read || 0,
    hint: t('borrowings.stats.totalWordsHint'),
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
  backgroundColor: currentUser.value?.avatarColor || 'var(--color-primary)',
  color: '#fff',
}))

const localizedTitle = (book?: Book) =>
  !book ? '' : locale.value === 'en' && book.titleEn ? book.titleEn : book.title

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

const formatAuthors = (book?: Book) => {
  if (!book) return t('empty.noData')
  const authors =
    locale.value === 'en' && book.authorsEn?.length ? book.authorsEn : book.authors
  return authors?.length ? authors.join(' / ') : t('empty.noData')
}

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

const canRenew = (record: BorrowingRecord) => record.renewals < MAX_RENEWALS

const handleRenew = async (record: BorrowingRecord) => {
  if (!requireAuth()) return
  if (!canRenew(record)) {
    actionVariant.value = 'warning'
    actionMessage.value = t('borrowings.renewLimitReached')
    return
  }

  const result = await libraryStore.renewBorrowing(record.id)
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
  libraryStore.fetchFavorites()
  libraryStore.fetchCredit()
  libraryStore.fetchBorrowingLimit()
})

watch(
  () => currentUser.value?.id,
  () => {
    libraryStore.fetchBorrowings(true)
    libraryStore.fetchFavorites(true)
    libraryStore.fetchCredit(true)
  },
)

const handleRemoveFavorite = async (bookId: string) => {
  if (!requireAuth()) return
  const result = await libraryStore.removeFavorite(bookId)
  actionVariant.value = result.success ? 'success' : 'error'
  actionMessage.value = result.message
  if (result.success) {
    setTimeout(() => {
      actionMessage.value = ''
    }, 2400)
  }
}
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
        <BaseButton to="/login" variant="primary" size="lg">{{ t('auth.login') }}</BaseButton>
      </div>
    </section>

    <section class="summary">
      <div v-for="card in summaryCards" :key="card.label" class="summary-card">
        <p class="label">{{ card.label }}</p>
        <p class="value">{{ card.value }}</p>
        <p class="hint">{{ card.hint }}</p>
      </div>
    </section>

    <BaseAlert v-if="actionMessage" :variant="actionVariant">{{ actionMessage }}</BaseAlert>

    <BasePanel v-if="isLoggedIn">
      <div class="section-header">
        <div>
          <p class="eyebrow">{{ t('borrowings.currentTab') }}</p>
          <h2>{{ t('borrowings.current') }}</h2>
        </div>
      </div>

      <div v-if="activeBorrowings.length" class="borrowing-grid">
        <article v-for="item in activeBorrowings" :key="item.record.id" class="borrowing-card">
          <div class="card-head">
            <p class="book-title">{{ localizedTitle(item.book) }}</p>
            <span class="due" :class="{ warning: daysUntil(item.record.dueDate) <= 3 }">
              {{ dueLabel(item.record.dueDate) }}
            </span>
          </div>
          <p class="book-author">{{ formatAuthors(item.book) }}</p>
          <p class="book-meta">
            {{ t('buttons.borrow') }}：{{ formatDate(item.record.borrowDate) }} · {{ t('borrowings.dueDate') }}：
            {{ formatDate(item.record.dueDate) }}
          </p>
          <div class="actions">
            <BaseButton type="button" variant="secondary" @click="handleReturn(item.record.id)">
              {{ t('borrowings.return') }}
            </BaseButton>
            <BaseButton
              type="button"
              variant="primary"
              :disabled="!canRenew(item.record)"
              @click="handleRenew(item.record)"
            >
              {{ canRenew(item.record) ? t('borrowings.renew') : t('borrowings.renewLimitReached') }}
            </BaseButton>
          </div>
          <p class="renewals">
            {{ t('borrowings.renewTip') }} ({{ item.record.renewals }} / {{ MAX_RENEWALS }})
          </p>
        </article>
      </div>
      <div v-else class="empty-state">
        <p>{{ t('borrowings.noActive') }}</p>
      </div>
    </BasePanel>
    <BasePanel v-else>
      <div class="empty-state">
        <p>{{ t('borrowings.loginHint') }}</p>
        <BaseButton to="/login" variant="primary" size="lg">{{ t('auth.login') }}</BaseButton>
      </div>
    </BasePanel>

    <BasePanel v-if="isLoggedIn">
      <div class="section-header">
        <div>
          <p class="eyebrow">{{ t('borrowings.historyTab') }}</p>
          <h2>{{ t('borrowings.historyTab') }}</h2>
        </div>
      </div>

      <div v-if="historyRecords.length" class="history-list">
        <article v-for="item in historyRecords" :key="item.record.id">
          <div>
            <p class="book-title">{{ localizedTitle(item.book) }}</p>
            <p class="book-author">{{ formatAuthors(item.book) }}</p>
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
    </BasePanel>
    <BasePanel v-else>
      <div class="empty-state">
        <p>{{ t('borrowings.loginHint') }}</p>
        <BaseButton to="/login" variant="primary" size="lg">{{ t('auth.login') }}</BaseButton>
      </div>
    </BasePanel>

    <section v-if="isLoggedIn" class="credit">
      <div>
        <p class="eyebrow">{{ t('borrowings.credit.title') }}</p>
        <h2>{{ t('borrowings.credit.title') }}：{{ creditSummary.levelText }}</h2>
        <p class="meta">
          {{ creditSummary.membership }} · {{ t('borrowings.credit.overdue') }}：{{ creditSummary.overdueCount }}
          · {{ t('borrowings.credit.status.' + creditSummary.status) }}
        </p>
        <p class="hint">{{ creditSummary.tip }}</p>
      </div>
      <div class="credit-pill" :class="creditSummary.levelKey === 'good' ? 'good' : creditSummary.levelKey">
        {{ creditSummary.score }} / {{ creditSummary.levelText }}
      </div>
    </section>

    <section v-if="isLoggedIn" class="favorites">
      <div class="section-header">
        <div>
          <p class="eyebrow">{{ t('borrowings.favorites.title') }}</p>
          <h2>{{ t('borrowings.favorites.subtitle') }}</h2>
          <p class="meta small">{{ t('borrowings.favorites.hint') }}</p>
        </div>
      </div>

      <div v-if="favoritesLoading" class="empty-state">
        <p>{{ t('borrowings.favorites.loading') }}</p>
      </div>
      <div v-else-if="favoriteBooks.length" class="favorite-grid">
        <div v-for="book in favoriteBooks" :key="book.id" class="favorite-row">
          <div>
            <p class="fav-title">{{ localizedTitle(book) }}</p>
            <p class="fav-author">{{ formatAuthors(book) }}</p>
            <p class="fav-meta">
              {{ t('bookDetail.category') }}：{{ book.category }} ·
              {{ t('bookDetail.currentStatus') }}：{{ book.status }}
            </p>
          </div>
          <button class="remove-fav" type="button" @click="handleRemoveFavorite(book.id)">
            {{ t('borrowings.favorites.remove') }}
          </button>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>{{ t('borrowings.favorites.empty') }}，<RouterLink to="/">{{ t('borrowings.favorites.goHome') }}</RouterLink>。</p>
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

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: var(--text-xs);
  color: var(--color-subtle);
  margin: 0;
}

.profile {
  display: flex;
  gap: 1rem;
  background: var(--color-surface);
  padding: 1.5rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  align-items: center;
  box-shadow: var(--shadow-soft);
}

.profile.not-logged {
  justify-content: center;
  text-align: center;
}

.avatar {
  width: 58px;
  height: 58px;
  border-radius: var(--radius-lg);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.meta {
  color: var(--color-muted);
  margin: 0.4rem 0 0;
}

.meta.small {
  font-size: var(--text-sm);
  margin-top: 0.2rem;
}
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 1.2rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

.summary-card .label {
  font-size: var(--text-sm);
  color: var(--color-subtle);
}

.summary-card .value {
  font-size: 2rem;
  margin: 0.4rem 0;
}

.summary-card .hint {
  color: var(--color-subtle);
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.2rem;
  background: var(--color-surface-soft);
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.book-title {
  margin: 0;
  font-weight: var(--font-weight-semibold);
}

.book-author {
  margin: 0.2rem 0;
  color: var(--color-muted);
}

.book-meta {
  margin: 0;
  color: var(--color-subtle);
}

.due {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
}

.due.warning {
  background: var(--color-warning-soft);
  color: var(--color-warning-strong);
}

.actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.9rem;
}

.renewals {
  margin: 0.8rem 0 0;
  font-size: var(--text-sm);
  color: var(--color-subtle);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  border-radius: 18px;
  background: var(--color-surface-soft);
  color: var(--color-muted);
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
  border-bottom: 1px solid var(--color-border);
}

.history-list article:last-child {
  border-bottom: none;
}

.status-pill {
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  background: var(--status-available-bg);
  color: var(--status-available-text);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
}

.credit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.2rem 1.5rem;
  box-shadow: var(--shadow-soft);
}

.credit .meta {
  color: var(--color-muted);
}

.credit .hint {
  margin-top: 0.4rem;
  color: var(--color-subtle);
}

.credit-pill {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-pill);
  font-weight: var(--font-weight-semibold);
  border: 1px solid var(--color-border);
}

.credit-pill.good {
  background: var(--color-success-soft);
  color: var(--color-success-strong);
  border-color: var(--color-success-strong);
}

.credit-pill.excellent {
  background: var(--color-success-soft);
  color: var(--color-success-strong);
  border-color: var(--color-success-strong);
}

.credit-pill.warning {
  background: var(--color-warning-soft);
  color: var(--color-warning-strong);
  border-color: var(--color-warning-strong);
}

.credit-pill.warn,
.credit-pill.warn {
  background: var(--color-warning-soft);
  color: var(--color-warning-strong);
  border-color: var(--color-warning-strong);
}

.credit-pill.suspended {
  background: var(--color-danger-soft);
  color: var(--color-danger-strong);
  border-color: var(--color-danger-strong);
}

.favorites {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  padding: 1.5rem;
  box-shadow: var(--shadow-soft);
}

.favorite-grid {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.favorite-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

.fav-title {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
}

.fav-author {
  margin: 0.2rem 0;
  color: var(--color-muted);
}

.fav-meta {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-subtle);
}

.remove-fav {
  border-radius: var(--radius-pill);
  padding: 0.45rem 0.9rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-muted);
  font-weight: var(--font-weight-semibold);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.remove-fav:hover {
  color: var(--color-danger-strong);
  border-color: var(--color-danger-strong);
  box-shadow: 0 12px 22px var(--color-danger-soft);
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
