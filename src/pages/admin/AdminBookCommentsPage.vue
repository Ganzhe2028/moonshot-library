<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ratingService } from '@/services/ratingService'
import type { Comment } from '@/types/library'

// 定义扩展的评论类型，包含书籍标题
interface BookComment extends Comment {
  bookTitle: string
}

// 状态管理
const allComments = ref<BookComment[]>([])
const loading = ref(false)
const deleting = ref(false)
const actionMessage = ref('')
const actionVariant = ref<'success' | 'error' | 'info'>('info')
const filterText = ref('')

// 获取所有书本评论
const fetchAllBookComments = async () => {
  loading.value = true
  try {
    allComments.value = await ratingService.getAllBookComments()
    // 按时间倒序排序，处理createdAt可能为undefined的情况
    allComments.value.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    showMessage('获取评论列表成功', 'success')
  } catch (error) {
    showMessage('获取评论列表失败', 'error')
    console.error('获取评论列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 显示消息
const showMessage = (message: string, variant: 'success' | 'error' | 'info' = 'info') => {
  actionMessage.value = message
  actionVariant.value = variant
  setTimeout(() => {
    actionMessage.value = ''
  }, 3000)
}

// 删除评论
const deleteComment = async (commentId: string) => {
  if (!confirm('确定要删除这条评论吗？')) return

  deleting.value = true
  try {
    const success = await ratingService.deleteComment(commentId)
    if (success) {
      showMessage('评论删除成功', 'success')
      // 从列表中移除删除的评论
      const index = allComments.value.findIndex(comment => comment.id === commentId)
      if (index > -1) {
        allComments.value.splice(index, 1)
      }
    } else {
      showMessage('评论删除失败', 'error')
    }
  } catch (error) {
    showMessage('评论删除失败', 'error')
    console.error('删除评论失败:', error)
  } finally {
    deleting.value = false
  }
}

// 格式化日期
const formatDate = (dateString?: string): string => {
  if (!dateString || typeof dateString !== 'string') return '未知时间'

  try {
    const date = new Date(dateString)
    // 检查是否是有效日期
    if (isNaN(date.getTime())) {
      return '无效日期'
    }
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '无效日期'
  }
}

// 过滤后的评论列表
const filteredComments = ref<BookComment[]>([])

// 更新过滤列表
const updateFilter = () => {
  if (!filterText.value.trim()) {
    filteredComments.value = allComments.value
  } else {
    const filterLower = filterText.value.toLowerCase()
    filteredComments.value = allComments.value.filter(comment =>
      comment.content.toLowerCase().includes(filterLower) ||
      comment.userName.toLowerCase().includes(filterLower) ||
      comment.bookTitle.toLowerCase().includes(filterLower)
    )
  }
}

// 监听过滤文本变化
const handleFilterChange = () => {
  updateFilter()
}

onMounted(() => {
  fetchAllBookComments()
})
</script>

<template>
  <div class="admin-book-comments-page">
    <header class="page-header">
      <h1>书本评论管理</h1>
      <p class="subtitle">管理所有书籍的评论</p>
    </header>

    <!-- 操作消息 -->
    <div v-if="actionMessage" :class="['action-message', actionVariant]">
      {{ actionMessage }}
    </div>

    <!-- 搜索过滤 -->
    <div class="filter-section">
      <input
        v-model="filterText"
        type="text"
        placeholder="搜索评论内容、用户名或书籍名称..."
        class="search-input"
        @input="handleFilterChange"
      >
      <p class="comment-count">共 {{ allComments.length }} 条评论，过滤后显示 {{ filteredComments.length }} 条</p>
    </div>

    <!-- 评论列表 -->
    <div class="comments-container">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="filteredComments.length === 0" class="empty">
        {{ filterText ? '没有找到匹配的评论' : '暂无评论' }}
      </div>
      <div v-else class="comments-list">
        <div
          v-for="comment in filteredComments"
          :key="comment.id"
          class="comment-card"
        >
          <div class="comment-header">
            <div class="comment-info">
              <span class="comment-author">{{ comment.userName }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <button
              type="button"
              class="delete-button"
              :disabled="deleting"
              @click="deleteComment(comment.id)"
            >
              {{ deleting ? '删除中...' : '删除' }}
            </button>
          </div>

          <div class="book-reference">
            <span class="book-title">书籍: {{ comment.bookTitle }}</span>
          </div>

          <div class="comment-content">{{ comment.content }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-book-comments-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #1f2937;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #6b7280;
}

.action-message {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.action-message.success {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.action-message.error {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.action-message.info {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.filter-section {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-input {
  flex: 1;
  min-width: 300px;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.comment-count {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.comments-container {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.loading,
.empty {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.comments-list {
  padding: 0;
}

.comment-card {
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.comment-card:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.comment-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.comment-author {
  font-weight: 600;
  color: #1f2937;
}

.comment-date {
  color: #6b7280;
  font-size: 0.875rem;
}

.delete-button {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-button:hover:not(:disabled) {
  background: #fecaca;
}

.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.book-reference {
  margin-bottom: 1rem;
}

.book-title {
  background-color: #f9fafb;
  color: #4b5563;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #e5e7eb;
}

.comment-content {
  line-height: 1.6;
  color: #374151;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    min-width: 100%;
  }

  .comment-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .delete-button {
    width: 100%;
  }
}
</style>
