<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useLibraryStore } from '@/stores/library'
import RatingStars from '@/components/RatingStars.vue'
import CommentSection from '@/components/CommentSection.vue'
import type { Comment } from '@/types/library'

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

const userRating = ref(0)
const ratingFeedback = ref('')
const ratingVariant = ref<'success' | 'error'>('success')

const commentSectionRef = ref<InstanceType<typeof CommentSection>>()
const comments = ref<Comment[]>([])

const handleRatingChange = (rating: number) => {
  userRating.value = rating
  // 这里将在store更新后调用API
  ratingFeedback.value = `您的评分: ${rating}星`
  ratingVariant.value = 'success'

  // 3秒后清除反馈信息
  setTimeout(() => {
    ratingFeedback.value = ''
  }, 3000)
}

// 处理评论提交
const handleCommentSubmit = async (content: string) => {
  if (!book.value) return

  // 模拟提交评论（将在store更新后实现真实API调用）
  const newComment: Comment = {
    id: Date.now().toString(),
    bookId: book.value.id,
    userId: 'current-user',
    userName: '当前用户',
    content,
    createdAt: new Date().toISOString()
  }

  comments.value.unshift(newComment)

  if (commentSectionRef.value) {
    commentSectionRef.value.setComments(comments.value)
  }
}

// 处理评论删除
const handleCommentDelete = (commentId: string) => {
  // 从评论列表中移除指定ID的评论
  comments.value = comments.value.filter(comment => comment.id !== commentId)
  
  // 更新评论区组件的数据
  if (commentSectionRef.value) {
    commentSectionRef.value.setComments(comments.value)
  }
}

// 处理评论加载
const handleCommentsLoad = () => {
  // 模拟加载评论（将在store更新后实现真实API调用）
  // 这里使用模拟数据
  const mockComments: Comment[] = [
    {
      id: '1',
      bookId: book.value?.id || '',
      userId: 'user1',
      userName: '张三',
      content: '这本书非常精彩，强烈推荐！',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      bookId: book.value?.id || '',
      userId: 'user2',
      userName: '李四',
      content: '内容丰富，值得一读。',
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ]

  comments.value = mockComments

  if (commentSectionRef.value) {
    commentSectionRef.value.setComments(comments.value)
  }
}

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
        <div class="rating-section">
          <RatingStars
            :average-rating="book.averageRating || 0"
            :show-average="true"
            v-model="userRating"
            @rating-change="handleRatingChange"
          />
          <span v-if="book.ratingCount" class="rating-count">
            ({{ book.ratingCount }} 人评分)
          </span>
        </div>
        <p v-if="ratingFeedback" :class="['rating-feedback', ratingVariant]">
          {{ ratingFeedback }}
        </p>
        <p class="summary">{{ book.description }}</p>
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

  <!-- 评论区 -->
  <div v-if="book" class="comments-section">
    <CommentSection
      ref="commentSectionRef"
      :book-id="book.id"
      @submit="handleCommentSubmit"
      @load="handleCommentsLoad"
      @delete="handleCommentDelete"
    />
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

.rating-section {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.rating-count {
  margin-left: 8px;
  color: #6b7280;
  font-size: 0.9rem;
}

.rating-feedback {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
}

.rating-feedback.success {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.rating-feedback.error {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
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

.comments-section {
  margin-top: 3rem;
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
