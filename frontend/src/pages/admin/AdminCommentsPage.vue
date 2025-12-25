<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import BaseAlert from '@/components/base/BaseAlert.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import * as communityService from '@/services/communityService'
import type { Comment } from '@/types/library'

// 状态管理
const allComments = ref<Array<{ post: communityService.CommunityPost, comment: Comment }>>([])
const loading = ref(false)
const deleting = ref(false)
const actionMessage = ref('')
const actionVariant = ref<'success' | 'error' | 'info'>('info')
const filterText = ref('')

// 获取所有评论
const fetchAllComments = async () => {
  loading.value = true
  try {
    allComments.value = await communityService.fetchAllComments()
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
const deleteComment = async (postId: string, commentId: string) => {
  if (!confirm('确定要删除这条评论吗？')) return

  deleting.value = true
  try {
    const success = await communityService.deletePostComment(postId, commentId)
    if (success) {
      showMessage('评论删除成功', 'success')
      // 重新获取评论列表
      await fetchAllComments()
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
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 过滤后的评论列表
const filteredComments = ref<Array<{ post: communityService.CommunityPost, comment: Comment }>>([])

// 更新过滤列表
const updateFilter = () => {
  if (!filterText.value.trim()) {
    filteredComments.value = allComments.value
  } else {
    const filterLower = filterText.value.toLowerCase()
    filteredComments.value = allComments.value.filter(item =>
      item.comment.content.toLowerCase().includes(filterLower) ||
      item.comment.userName.toLowerCase().includes(filterLower) ||
      item.post.content.toLowerCase().includes(filterLower)
    )
  }
}

watch([filterText, allComments], updateFilter, { immediate: true })

onMounted(() => {
  fetchAllComments()
})
</script>

<template>
  <div class="admin-comments-page u-stack-lg">
    <header class="page-header u-stack-sm">
      <h1>社区评论管理</h1>
      <p class="subtitle">管理所有社区动态中的评论</p>
    </header>

    <!-- 操作消息 -->
    <BaseAlert v-if="actionMessage" :variant="actionVariant">{{ actionMessage }}</BaseAlert>

    <!-- 搜索过滤 -->
    <div class="filter-section u-split u-wrap">
      <BaseInput
        v-model="filterText"
        type="text"
        placeholder="搜索评论内容或用户名..."
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
          v-for="item in filteredComments"
          :key="item.comment.id"
          class="comment-card"
        >
          <div class="comment-header u-split u-wrap">
            <div class="comment-info u-inline u-inline-sm">
              <span class="comment-author">{{ item.comment.userName }}</span>
              <span class="comment-date">{{ formatDate(item.comment.createdAt) }}</span>
            </div>
            <BaseButton
              type="button"
              variant="danger"
              size="sm"
              :disabled="deleting"
              @click="deleteComment(item.post.id, item.comment.id)"
            >
              {{ deleting ? '删除中...' : '删除' }}
            </BaseButton>
          </div>

          <div class="comment-content">{{ item.comment.content }}</div>

          <div class="post-reference">
            <p class="post-label">所属动态:</p>
            <div class="post-preview">
              <span class="post-author">{{ item.post.userName }}: </span>
              <span class="post-content">{{ item.post.content }}</span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.admin-comments-page {
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

.comment-content {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: var(--color-muted);
}

.post-reference {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.post-label {
  margin: 0 0 0.5rem;
  font-size: var(--text-sm);
  color: var(--color-subtle);
  font-weight: 500;
}

.post-preview {
  padding: 0.75rem;
  background: var(--color-surface-soft);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  font-size: var(--text-sm);
}

.post-author {
  font-weight: 600;
  color: var(--color-ink);
}

.post-content {
  color: var(--color-muted);
  word-break: break-word;
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
