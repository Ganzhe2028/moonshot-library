<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { Book } from '@/types/library'

const props = defineProps<{
  book: Book
}>()

const statusLabel = computed(() => {
  const map: Record<string, { text: string; className: string }> = {
    available: { text: '可借阅', className: 'available' },
    borrowed: { text: '已借出', className: 'borrowed' },
    reserved: { text: '已预约', className: 'reserved' },
    maintenance: { text: '维护中', className: 'reserved' },
  }

  return map[props.book.status]
})

const authorLine = computed(() => {
  if (!props.book.authors?.length) return '未知作者'
  return props.book.authors.join(' / ')
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
      <p class="category">{{ book.category }}</p>
      <h3>{{ book.title }}</h3>
      <p class="author">{{ authorLine }}</p>

      <div class="tags">
        <span v-for="tag in book.tags" :key="tag">{{ tag }}</span>
      </div>
    </div>
    <span class="status" :class="statusLabel?.className">{{ statusLabel?.text }}</span>
  </RouterLink>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid rgba(15, 17, 21, 0.05);
  background: #fff;
  box-shadow: 0 20px 35px rgba(15, 17, 21, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 45px rgba(15, 17, 21, 0.12);
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
  color: #8a8e99;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.author {
  margin: 0;
  color: #5b5d63;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.tags span {
  background: rgba(99, 102, 241, 0.08);
  color: #3b3f55;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
}

.status {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.75rem;
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  font-weight: 600;
}

.status.available {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.status.borrowed {
  background: rgba(248, 113, 113, 0.14);
  color: #b91c1c;
}

.status.reserved {
  background: rgba(251, 191, 36, 0.18);
  color: #92400e;
}
</style>
