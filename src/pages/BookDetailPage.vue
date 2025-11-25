<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useLibraryStore } from '@/stores/library'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()

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

const feedback = ref('')
const feedbackVariant = ref<'success' | 'error'>('success')

const statusCopy = computed(() => {
  switch (book.value?.status) {
    case 'available':
      return { label: '可借阅', description: '当前无预约，可以立即借阅。' }
    case 'borrowed':
      return { label: '借出中', description: '请稍后再试，或关注我的借阅。' }
    case 'reserved':
      return { label: '已预约', description: '该书已被预约，等待归还。' }
    default:
      return { label: '--', description: '' }
  }
})

const handleBorrow = async () => {
  if (!book.value) return
  const result = await libraryStore.borrowBook(book.value.id)
  feedbackVariant.value = result.success ? 'success' : 'error'
  feedback.value = result.message
}

const goBack = () => router.push('/')

const authorLine = computed(() =>
  book.value?.authors?.length ? book.value.authors.join(' / ') : '未知作者',
)

const coverImage = computed(
  () =>
    book.value?.coverImage ||
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
)
</script>

<template>
  <div v-if="book" class="page">
    <button type="button" class="back" @click="goBack">← 返回图书列表</button>
    <section class="header">
      <div class="cover" :style="{ backgroundImage: `url(${coverImage})` }" />
      <div class="content">
        <p class="category">{{ book.category }}</p>
        <h1>{{ book.title }}</h1>
        <p class="author">作者 · {{ authorLine }}</p>
        <p class="summary">{{ book.description }}</p>

        <div class="tags">
          <span v-for="tag in book.tags" :key="tag">{{ tag }}</span>
        </div>

        <div class="actions">
          <button
            type="button"
            class="primary"
            :disabled="hasBorrowed || book.status !== 'available'"
            @click="handleBorrow"
          >
            {{ hasBorrowed ? '已借阅' : book.status === 'available' ? '立即借阅' : '暂不可借' }}
          </button>
          <button type="button" class="secondary" @click="router.push('/borrowings')">
            查看我的借阅
          </button>
        </div>

        <p v-if="feedback" :class="['feedback', feedbackVariant]">{{ feedback }}</p>
      </div>
    </section>

    <section class="details">
      <div class="card">
        <p class="card-title">图书信息</p>
        <dl>
          <div>
            <dt>ISBN</dt>
            <dd>{{ book.isbn }}</dd>
          </div>
          <div>
            <dt>分类号</dt>
            <dd>{{ book.category }}</dd>
          </div>
          <div>
            <dt>馆内位置</dt>
            <dd>{{ book.location }}</dd>
          </div>
          <div>
            <dt>当前状态</dt>
            <dd>{{ statusCopy.label }}</dd>
          </div>
        </dl>
      </div>

      <div class="card">
        <p class="card-title">借阅提示</p>
        <p class="card-body">
          {{ statusCopy.description }}
          <span v-if="hasBorrowed"> 你已借阅该书，可在「我的借阅」中查看状态。 </span>
        </p>
        <ul class="card-list">
          <li>默认借阅周期 21 天，可续借 2 次。</li>
          <li>到期前 3 天将发送提醒。</li>
          <li>请保持图书完好，按时归还。</li>
        </ul>
      </div>
    </section>
  </div>

  <div v-else class="missing">
    <p>未找到对应图书，可能已被移除。</p>
    <button type="button" @click="goBack">返回首页</button>
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
