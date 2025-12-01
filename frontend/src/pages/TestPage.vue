<template>
  <div class="test-page">
    <h1>图书数据测试</h1>
    <div class="info">
      <p>图书总数: {{ libraryStore.books.length }}</p>
      <p>加载状态: {{ libraryStore.booksLoading ? '加载中...' : '已加载' }}</p>
      <p>错误信息: {{ libraryStore.booksError || '无错误' }}</p>
    </div>
    
    <div class="books-list" v-if="libraryStore.books.length > 0">
      <h2>图书详情:</h2>
      <div v-for="book in libraryStore.books" :key="book.id" class="book-item">
        <pre>{{ JSON.stringify(book, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLibraryStore } from '@/stores/library'
import { onMounted } from 'vue'

const libraryStore = useLibraryStore()

onMounted(() => {
  console.log('图书数据:', libraryStore.books)
  libraryStore.fetchBooks(true) // 强制重新加载
})
</script>

<style scoped>
.test-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.info {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.books-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.book-item {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

pre {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.875rem;
}
</style>