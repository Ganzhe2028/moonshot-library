<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import type { Announcement } from '@/types/library'
import * as announcementService from '@/services/announcementService'

const { t } = useI18n()
const authStore = useAuthStore()

// 状态管理
const announcements = ref<Announcement[]>([])
const loading = ref(false)
const actionMessage = ref('')
const actionVariant = ref<'success' | 'error' | 'info'>('info')
const showCreateForm = ref(false)
const editingAnnouncement = ref<Announcement | null>(null)

// 表单数据
const form = ref({
  title: '',
  content: '',
  author: ''
})

// 检查是否为管理员或图书管理员
const isAdmin = computed(() => authStore.isAdmin || authStore.isLibrarian)

// 获取公告列表
const fetchAnnouncements = async () => {
  // 已经在页面中通过v-if="!isAdmin"进行了权限检查，这里无需重复检查
  
  loading.value = true
  try {
    announcements.value = await announcementService.getAnnouncements()
    showMessage('获取公告列表成功', 'success')
  } catch (error) {
    showMessage('获取公告列表失败', 'error')
    console.error('获取公告列表失败:', error)
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

// 打开创建表单
const openCreateForm = () => {
  form.value = {
    title: '',
    content: '',
    author: authStore.user?.name || '管理员'
  }
  editingAnnouncement.value = null
  showCreateForm.value = true
}

// 打开编辑表单
const openEditForm = (announcement: Announcement) => {
  form.value = {
    title: announcement.title,
    content: announcement.content,
    author: announcement.author
  }
  editingAnnouncement.value = announcement
  showCreateForm.value = true
}

// 提交表单
const submitForm = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    showMessage('标题和内容不能为空', 'error')
    return
  }
  
  loading.value = true
  try {
    if (editingAnnouncement.value) {
      // 更新公告
      await announcementService.updateAnnouncement(editingAnnouncement.value.id, form.value)
      showMessage('公告更新成功', 'success')
    } else {
      // 创建公告
      await announcementService.createAnnouncement(form.value)
      showMessage('公告创建成功', 'success')
    }
    
    showCreateForm.value = false
    await fetchAnnouncements()
  } catch (error) {
    showMessage(editingAnnouncement.value ? '公告更新失败' : '公告创建失败', 'error')
    console.error('保存公告失败:', error)
  } finally {
    loading.value = false
  }
}

// 删除公告
const deleteAnnouncement = async (id: string) => {
  if (!confirm('确定要删除这条公告吗？')) return
  
  loading.value = true
  try {
    await announcementService.deleteAnnouncement(id)
    showMessage('公告删除成功', 'success')
    await fetchAnnouncements()
  } catch (error) {
    showMessage('公告删除失败', 'error')
    console.error('删除公告失败:', error)
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchAnnouncements()
})
</script>

<template>
  <div class="admin-announcements-page">
    <header class="page-header">
      <h1>{{ t('admin.announcements.title') || '公告管理' }}</h1>
      <p class="subtitle">{{ t('admin.announcements.subtitle') || '管理社区页面的公告信息' }}</p>
    </header>

    <div v-if="!isAdmin" class="not-authorized">
      <p>{{ t('admin.notAuthorized') || '您没有权限访问此页面' }}</p>
    </div>

    <template v-else>
      <p v-if="actionMessage" :class="['action-message', actionVariant]">{{ actionMessage }}</p>

      <div class="actions-bar">
        <button type="button" class="primary" @click="openCreateForm" :disabled="loading">
          {{ t('admin.create') || '创建公告' }}
        </button>
      </div>

      <div class="announcements-grid">
        <div v-if="loading" class="loading">
          <p>{{ t('admin.loading') || '加载中...' }}</p>
        </div>
        
        <div v-else-if="announcements.length === 0" class="empty">
          <p>{{ t('admin.noData') || '暂无公告数据' }}</p>
        </div>
        
        <div v-else class="announcement-list">
          <div v-for="announcement in announcements" :key="announcement.id" class="announcement-card">
            <div class="card-header">
              <h3 class="announcement-title">{{ announcement.title }}</h3>
              <div class="card-actions">
                <button type="button" class="secondary" @click="openEditForm(announcement)">
                  {{ t('admin.edit') || '编辑' }}
                </button>
                <button type="button" class="danger" @click="deleteAnnouncement(announcement.id)">
                  {{ t('admin.delete') || '删除' }}
                </button>
              </div>
            </div>
            <p class="announcement-content">{{ announcement.content }}</p>
            <div class="announcement-meta">
              <span>{{ announcement.author }}</span>
              <span>{{ formatDate(announcement.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 创建/编辑公告表单 -->
      <div v-if="showCreateForm" class="form-overlay" @click.self="showCreateForm = false">
        <div class="form-container">
          <h2>{{ editingAnnouncement ? '编辑公告' : '创建公告' }}</h2>
          
          <div class="form-group">
            <label for="title">{{ t('admin.title') || '标题' }}</label>
            <input 
              id="title" 
              v-model="form.title" 
              type="text" 
              placeholder="请输入公告标题"
            >
          </div>
          
          <div class="form-group">
            <label for="content">{{ t('admin.content') || '内容' }}</label>
            <textarea 
              id="content" 
              v-model="form.content" 
              rows="6" 
              placeholder="请输入公告内容"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="author">{{ t('admin.author') || '作者' }}</label>
            <input 
              id="author" 
              v-model="form.author" 
              type="text" 
              placeholder="请输入作者名称"
              :disabled="isAdmin"
            >
          </div>
          
          <div class="form-actions">
            <button type="button" class="secondary" @click="showCreateForm = false">
              {{ t('admin.cancel') || '取消' }}
            </button>
            <button type="button" class="primary" @click="submitForm" :disabled="loading">
              {{ loading ? '保存中...' : (t('admin.save') || '保存') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-announcements-page {
  padding: 1rem 0 3rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin: 0;
}

.subtitle {
  color: #6b7280;
  margin-top: 0.5rem;
}

.not-authorized {
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  color: #ef4444;
}

.action-message {
  padding: 0.8rem 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  text-align: center;
}

.action-message.success {
  background: rgba(16, 185, 129, 0.1);
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.action-message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.action-message.info {
  background: rgba(59, 130, 246, 0.1);
  color: #1e40af;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.actions-bar {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.primary,
.secondary,
.danger {
  border-radius: 12px;
  padding: 0.65rem 1.2rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary {
  background: linear-gradient(120deg, #4338ca, #6366f1);
  color: white;
}

.primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary {
  background: rgba(15, 17, 21, 0.06);
  color: #1f1f25;
}

.secondary:hover {
  background: rgba(15, 17, 21, 0.08);
}

.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.announcements-grid {
  background: #fff;
  border-radius: 24px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 17, 21, 0.05);
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.announcement-card {
  border: 1px solid rgba(15, 17, 21, 0.05);
  border-radius: 16px;
  padding: 1.2rem;
  background: rgba(249, 250, 255, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.8rem;
  gap: 1rem;
}

.announcement-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 0.6rem;
}

.announcement-content {
  margin: 0 0 0.8rem 0;
  line-height: 1.6;
  color: #4b5563;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.announcement-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #9ca3af;
}

/* 表单样式 */
.form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.form-container {
  background: #fff;
  border-radius: 24px;
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-container h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  color: #1f2937;
}

.form-group input,
.form-group textarea {
  width: 100%;
  border: 1px solid rgba(15, 17, 21, 0.1);
  border-radius: 12px;
  padding: 0.8rem;
  font-size: 1rem;
  font-family: inherit;
  background: rgba(249, 250, 255, 0.6);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .card-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .announcement-meta {
    flex-direction: column;
    gap: 0.3rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions button {
    width: 100%;
  }
}
</style>