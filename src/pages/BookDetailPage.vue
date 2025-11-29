<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useLibraryStore } from '@/stores/library'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const { t, locale } = useI18n()

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') {
      libraryStore.fetchBookById(id)
    }
  },
  { immediate: true },
)

onMounted(() => {
  libraryStore.fetchBorrowings()
})

const book = computed(() => libraryStore.getBookById(route.params.id as string))
const hasBorrowed = computed(() =>
  book.value ? libraryStore.isBookBorrowedByUser(book.value.id) : false,
)

const displayTitle = computed(() => {
  if (!book.value) return ''
  if (locale.value === 'en' && book.value.titleEn) return book.value.titleEn
  return book.value.title
})

const displayCategory = computed(() => {
  if (!book.value) return ''
  if (locale.value === 'en' && book.value.categoryEn) return book.value.categoryEn
  return book.value.category
})

const displayTags = computed(() => {
  if (!book.value) return []
  if (locale.value === 'en' && book.value.tagsEn?.length) return book.value.tagsEn
  return book.value.tags || []
})

const feedback = ref('')
const feedbackVariant = ref<'success' | 'error'>('success')

const statusCopy = computed(() => {
  switch (book.value?.status) {
    case 'available':
      return { label: t('bookDetail.available.label'), desc: t('bookDetail.available.desc') }
    case 'borrowed':
      return { label: t('bookDetail.borrowed.label'), desc: t('bookDetail.borrowed.desc') }
    case 'reserved':
      return { label: t('bookDetail.reserved.label'), desc: t('bookDetail.reserved.desc') }
    case 'maintenance':
      return { label: t('bookDetail.maintenance.label'), desc: t('bookDetail.maintenance.desc') }
    default:
      return { label: '--', desc: '' }
  }
})

const handleBorrow = async () => {
  if (!book.value) return
  const result = await libraryStore.borrowBook(book.value.id)
  feedbackVariant.value = result.success ? 'success' : 'error'
  feedback.value = result.message
}

const goBack = () => router.push('/')

const authorLine = computed(() => {
  if (!book.value) return t('empty.noData')
  const authors =
    locale.value === 'en' && book.value.authorsEn?.length ? book.value.authorsEn : book.value.authors
  return authors?.length ? authors.join(' / ') : t('empty.noData')
})

const displayDescription = computed(() => {
  if (!book.value) return ''
  if (locale.value === 'en' && book.value.descriptionEn) return book.value.descriptionEn
  return book.value.description || t('empty.noData')
})

const coverImage = computed(
  () =>
    book.value?.coverImage ||
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
)
</script>

<template>
  <div v-if="book" class="page">
    <button type="button" class="back" @click="goBack">← {{ t('bookDetail.back') }}</button>
    <section class="header">
      <div class="cover" :style="{ backgroundImage: `url(${coverImage})` }" />
      <div class="content">
        <p class="category">{{ displayCategory }}</p>
        <h1>{{ displayTitle }}</h1>
        <p class="author">{{ t('bookDetail.info') }} · {{ authorLine }}</p>
        <p class="summary">{{ displayDescription }}</p>

        <div class="tags">
          <span v-for="tag in displayTags" :key="tag">{{ tag }}</span>
        </div>

        <div class="actions">
          <button
            type="button"
            class="primary"
            :disabled="hasBorrowed || book.status !== 'available'"
            @click="handleBorrow"
          >
            {{
              hasBorrowed
                ? t('bookDetail.alreadyBorrowed')
                : book.status === 'available'
                  ? t('bookDetail.borrowNow')
                  : t('bookDetail.unavailable')
            }}
          </button>
          <button type="button" class="secondary" @click="router.push('/borrowings')">
            {{ t('bookDetail.viewBorrowings') }}
          </button>
        </div>

        <p v-if="feedback" :class="['feedback', feedbackVariant]">{{ feedback }}</p>
      </div>
    </section>

    <section class="details">
      <div class="card">
        <p class="card-title">{{ t('bookDetail.info') }}</p>
        <dl>
          <div>
            <dt>{{ t('bookDetail.isbn') }}</dt>
            <dd>{{ book.isbn }}</dd>
          </div>
          <div>
            <dt>{{ t('bookDetail.category') }}</dt>
            <dd>{{ displayCategory }}</dd>
          </div>
          <div>
            <dt>{{ t('bookDetail.location') }}</dt>
            <dd>{{ book.location }}</dd>
          </div>
          <div>
            <dt>{{ t('bookDetail.currentStatus') }}</dt>
            <dd>{{ statusCopy.label }}</dd>
          </div>
        </dl>
      </div>

      <div class="card">
        <p class="card-title">{{ t('bookDetail.borrowTips') }}</p>
        <p class="card-body">
          {{ statusCopy.desc }}
          <span v-if="hasBorrowed"> {{ t('bookDetail.borrowedHint') }} </span>
        </p>
        <ul class="card-list">
          <li v-for="tip in t('bookDetail.tips')" :key="tip">{{ tip }}</li>
        </ul>
      </div>
    </section>
  </div>

  <div v-else class="missing">
    <p>{{ t('bookDetail.missing') }}</p>
    <button type="button" @click="goBack">{{ t('bookDetail.missingBack') }}</button>
  </div>
</template>

<style scoped>
.page {
  padding: 1rem 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.back {
  align-self: flex-start;
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  background: rgba(15, 17, 21, 0.05);
  color: #333;
}

.header {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
}

.cover {
  border-radius: 30px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.category {
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #8a8e99;
  margin-bottom: 0.6rem;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.7rem);
}

.author {
  color: #4c4f59;
  margin: 0.4rem 0 1rem;
}

.summary {
  color: #3b3f55;
  line-height: 1.7;
}

.tags {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin: 1rem 0 1.5rem;
}

.tags span {
  background: rgba(99, 102, 241, 0.12);
  color: #312e81;
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
}

.actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.primary,
.secondary {
  border-radius: 14px;
  padding: 0.85rem 1.4rem;
  font-weight: 600;
}

.primary {
  background: linear-gradient(120deg, #4338ca, #6366f1);
  color: white;
  min-width: 160px;
}

.primary:disabled {
  background: rgba(99, 102, 241, 0.2);
  cursor: not-allowed;
  color: #434559;
}

.secondary {
  background: rgba(15, 17, 21, 0.05);
  color: #1f1f25;
}

.feedback {
  margin-top: 0.8rem;
  padding: 0.7rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
}

.feedback.success {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.feedback.error {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.card {
  background: #fff;
  border-radius: 24px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 17, 21, 0.06);
}

.card-title {
  margin-top: 0;
  font-weight: 600;
}

dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 0;
}

dt {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #8a8e99;
  margin-bottom: 0.3rem;
}

dd {
  margin: 0;
  font-weight: 600;
}

.card-body {
  color: #4c4f59;
  margin-top: 0.2rem;
}

.card-list {
  padding-left: 1.1rem;
  color: #4c4f59;
}

.missing {
  padding: 3rem 0;
  text-align: center;
}

.missing button {
  margin-top: 1rem;
  border-radius: 12px;
  padding: 0.8rem 1.5rem;
  background: #4338ca;
  color: white;
}

@media (max-width: 900px) {
  .header {
    grid-template-columns: 1fr;
  }

  .cover {
    height: 280px;
  }
}
</style>
