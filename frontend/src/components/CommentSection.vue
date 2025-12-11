<template>
  <div class="comment-section">
    <h3 class="section-title">{{ title }}</h3>

    <!-- 评论输入区域 -->
    <div class="comment-form">
      <textarea
        v-model="newComment"
        :placeholder="placeholder"
        class="comment-input"
        rows="3"
      ></textarea>
      <div class="form-actions">
        <button
          class="submit-button"
          :disabled="!canSubmit || isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? submittingText : submitText }}
        </button>
      </div>
      <p v-if="submitFeedback" :class="['submit-feedback', feedbackVariant]">
        {{ submitFeedback }}
      </p>
    </div>

    <!-- 评论列表 -->
    <div class="comments-container">
      <div v-if="comments.length > 0" class="comments-list">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item"
        >
          <div class="comment-header">
            <span class="comment-author">{{ comment.userName }}</span>
            <div class="comment-actions">
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              <button
                v-if="isAdmin"
                class="delete-comment-btn"
                @click="handleDeleteComment(comment.id)"
                title="删除评论"
              >
                删除
              </button>
            </div>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
        </div>
      </div>
      <div v-else-if="!isLoading" class="no-comments">
        {{ noCommentsText }}
      </div>
      <div v-if="isLoading" class="loading-comments">
        {{ loadingText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Comment } from '@/types/library'

const authStore = useAuthStore()

interface Props {
  bookId: string
  title?: string
  placeholder?: string
  submitText?: string
  submittingText?: string
  noCommentsText?: string
  loadingText?: string
}

withDefaults(defineProps<Props>(), {
  title: '评论区',
  placeholder: '请输入您的评论...',
  submitText: '提交评论',
  submittingText: '提交中...',
  noCommentsText: '暂无评论，快来发表第一条评论吧！',
  loadingText: '加载评论中...'
})

const emit = defineEmits<{
  'submit': [comment: string]
  'load': []
  'delete': [commentId: string]
}>()

const newComment = ref('')
const comments = ref<Comment[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const submitFeedback = ref('')
const feedbackVariant = ref<'success' | 'error'>('success')

const canSubmit = computed(() => newComment.value.trim().length > 0)

// 检查是否为管理员或图书管理员
const isAdmin = computed(() => authStore.isAdmin || authStore.isLibrarian)

// 格式化日期
const formatDate = (dateString?: string): string => {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 30) return `${diffDays}天前`

  return date.toLocaleDateString('zh-CN')
}

// 删除评论
const handleDeleteComment = async (commentId: string) => {
  if (!confirm('确定要删除这条评论吗？')) return

  try {
    emit('delete', commentId)
  } catch (err) {
    console.error('删除评论失败:', err)
  }
}

// 提交评论
const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true
  submitFeedback.value = ''

  try {
    // 触发提交事件
    emit('submit', newComment.value.trim())

    // 重置输入框
    newComment.value = ''

    submitFeedback.value = '评论提交成功！'
    feedbackVariant.value = 'success'
  } catch {
    submitFeedback.value = '评论提交失败，请重试'
    feedbackVariant.value = 'error'
  } finally {
    isSubmitting.value = false

    // 3秒后清除反馈信息
    setTimeout(() => {
      submitFeedback.value = ''
    }, 3000)
  }
}

// 加载评论
const loadComments = () => {
  isLoading.value = true
  emit('load')
}

// 设置评论数据（供父组件调用）
defineExpose({
  setComments: (commentsData: Comment[]) => {
    comments.value = commentsData
    isLoading.value = false
  },
  setLoading: (loading: boolean) => {
    isLoading.value = loading
  },
  loadComments
})

// 组件挂载时加载评论
onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.comment-section {
  margin-top: 2rem;
}

.section-title {
  font-size: var(--text-xl);
  margin-bottom: 1.5rem;
  color: var(--color-ink);
}

.comment-form {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

.comment-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.8rem 1rem;
  font-size: var(--text-base);
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.comment-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.submit-button {
  background: var(--cta-gradient);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.7rem 1.5rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.2s ease;
  box-shadow: 0 12px 24px var(--color-primary-soft);
}

.submit-button:hover:not(:disabled) {
  filter: brightness(0.96);
}

.submit-button:disabled {
  background: var(--color-primary-soft);
  cursor: not-allowed;
}

.submit-feedback {
  margin-top: 0.8rem;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.submit-feedback.success {
  background: var(--color-success-soft);
  color: var(--color-success-strong);
}

.submit-feedback.error {
  background: var(--color-danger-soft);
  color: var(--color-danger-strong);
}

.comments-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 1.2rem;
  border: 1px solid var(--color-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.comment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.delete-comment-btn {
  background: none;
  border: none;
  color: var(--color-danger);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-xs);
  transition: background-color 0.2s ease;
}

.delete-comment-btn:hover {
  background-color: var(--color-danger-soft);
}

.comment-author {
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
}

.comment-date {
  font-size: var(--text-xs);
  color: var(--color-subtle);
}

.comment-content {
  color: var(--color-muted);
  line-height: 1.6;
  word-wrap: break-word;
}

.no-comments,
.loading-comments {
  text-align: center;
  padding: 2rem;
  color: var(--color-subtle);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-form,
  .comment-item {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.3rem;
  }

  .submit-button {
    width: 100%;
  }
}
</style>
