<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import BaseAlert from '@/components/base/BaseAlert.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
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

watch([filterText, allComments], updateFilter, { immediate: true })

onMounted(() => {
  fetchAllBookComments()
})
</script>

<template>
  <div class="admin-book-comments-page u-stack-lg">
    <header class="page-header u-stack-sm">
      <h1>书本评论管理</h1>
      <p class="subtitle">管理所有书籍的评论</p>
    </header>

    <!-- 操作消息 -->
    <BaseAlert v-if="actionMessage" :variant="actionVariant">{{ actionMessage }}</BaseAlert>

    <!-- 搜索过滤 -->
    <div class="filter-section u-split u-wrap">
      <BaseInput
        v-model="filterText"
        type="text"
        placeholder="搜索评论内容、用户名或书籍名称..."
        class="search-input"
      />
      <p class="comment-count">共 {{ allComments.length }} 条评论，过滤后显示 {{ filteredComments.length }} 条</p>
    </div>

    <!-- 评论列表 -->
    <BaseCard class="comments-container" padding="none" radius="lg" shadow="none">
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
          <div class="comment-header u-split u-wrap">
            <div class="comment-info u-inline u-inline-sm">
              <span class="comment-author">{{ comment.userName }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <BaseButton
              type="button"
              variant="danger"
              size="sm"
              :disabled="deleting"
              @click="deleteComment(comment.id)"
            >
              {{ deleting ? '删除中...' : '删除' }}
            </BaseButton>
          </div>

          <div class="book-reference">
            <span class="book-title">书籍: {{ comment.bookTitle }}</span>
          </div>

          <div class="comment-content">{{ comment.content }}</div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.admin-book-comments-page {
}

.page-header {
}

.page-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--color-ink);
}

.subtitle {
  margin: 0;
  color: var(--color-subtle);
}

.filter-section {
  margin-bottom: 0;
}

.search-input {
  flex: 1;
  min-width: 300px;
}

.comment-count {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--text-sm);
}

.comments-container {
  overflow: hidden;
}

.loading,
.empty {
  padding: 3rem;
  text-align: center;
  color: var(--color-subtle);
}

.comments-list {
  padding: 0;
}

.comment-card {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.comment-card:last-child {
  border-bottom: none;
}

.comment-header {
  margin-bottom: 0.75rem;
}

.comment-info {
}

.comment-author {
  font-weight: 600;
  color: var(--color-ink);
}

.comment-date {
  color: var(--color-subtle);
  font-size: var(--text-sm);
}

.book-reference {
  margin-bottom: 1rem;
}

.book-title {
  background-color: var(--color-surface-soft);
  color: var(--color-muted);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  border: 1px solid var(--color-border);
}

.comment-content {
  line-height: 1.6;
  color: var(--color-muted);
  padding: 1rem;
  background-color: var(--color-surface-soft);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
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

  .base-button {
    width: 100%;
  }
}
</style>
