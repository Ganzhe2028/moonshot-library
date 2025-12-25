<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import BaseAlert from '@/components/base/BaseAlert.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
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
  <div class="admin-announcements-page u-stack-lg">
    <header class="page-header u-stack-sm">
      <h1>{{ t('admin.announcements.title') || '公告管理' }}</h1>
      <p class="subtitle">{{ t('admin.announcements.subtitle') || '管理社区页面的公告信息' }}</p>
    </header>

    <div v-if="!isAdmin" class="not-authorized">
      <p>{{ t('admin.notAuthorized') || '您没有权限访问此页面' }}</p>
    </div>

    <template v-else>
      <BaseAlert v-if="actionMessage" :variant="actionVariant">{{ actionMessage }}</BaseAlert>

      <div class="actions-bar u-inline">
        <BaseButton type="button" variant="primary" size="sm" @click="openCreateForm" :disabled="loading">
          {{ t('admin.create') || '创建公告' }}
        </BaseButton>
      </div>

      <BaseCard class="announcements-grid" padding="md" radius="lg" shadow="none">
        <div v-if="loading" class="loading">
          <p>{{ t('admin.loading') || '加载中...' }}</p>
        </div>

        <div v-else-if="announcements.length === 0" class="empty">
          <p>{{ t('admin.noData') || '暂无公告数据' }}</p>
        </div>

        <div v-else class="announcement-list u-stack">
          <div v-for="announcement in announcements" :key="announcement.id" class="announcement-card">
            <div class="card-header u-split u-wrap">
              <h3 class="announcement-title">{{ announcement.title }}</h3>
              <div class="card-actions u-inline u-inline-sm">
                <BaseButton type="button" variant="ghost" size="sm" @click="openEditForm(announcement)">
                  {{ t('admin.edit') || '编辑' }}
                </BaseButton>
                <BaseButton type="button" variant="danger" size="sm" @click="deleteAnnouncement(announcement.id)">
                  {{ t('admin.delete') || '删除' }}
                </BaseButton>
              </div>
            </div>
            <p class="announcement-content">{{ announcement.content }}</p>
            <div class="announcement-meta u-split u-wrap">
              <span>{{ announcement.author }}</span>
              <span>{{ formatDate(announcement.createdAt) }}</span>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 创建/编辑公告表单 -->
      <BaseModal
        :open="showCreateForm"
        :title="editingAnnouncement ? '编辑公告' : '创建公告'"
        @close="showCreateForm = false"
      >
        <div class="form-group u-stack">
          <label for="title">{{ t('admin.title') || '标题' }}</label>
          <BaseInput id="title" v-model="form.title" type="text" placeholder="请输入公告标题" />
        </div>

        <div class="form-group u-stack">
          <label for="content">{{ t('admin.content') || '内容' }}</label>
          <textarea id="content" v-model="form.content" rows="6" placeholder="请输入公告内容"></textarea>
        </div>

        <div class="form-group u-stack">
          <label for="author">{{ t('admin.author') || '作者' }}</label>
          <BaseInput
            id="author"
            v-model="form.author"
            type="text"
            placeholder="请输入作者名称"
            :disabled="isAdmin"
          />
        </div>

        <template #footer>
          <BaseButton type="button" variant="secondary" @click="showCreateForm = false">
            {{ t('admin.cancel') || '取消' }}
          </BaseButton>
          <BaseButton type="button" variant="primary" :disabled="loading" @click="submitForm">
            {{ loading ? '保存中...' : (t('admin.save') || '保存') }}
          </BaseButton>
        </template>
      </BaseModal>
    </template>
  </div>
</template>

<style scoped>
.admin-announcements-page {
  padding: 1rem 0 3rem;
}

.page-header {
}

.page-header h1 {
  font-size: 2rem;
  margin: 0;
}

.subtitle {
  color: var(--color-subtle);
  margin-top: 0;
}

.not-authorized {
  background: var(--color-danger-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  text-align: center;
  color: var(--color-danger-strong);
}

.actions-bar {
  margin-bottom: 0;
  justify-content: flex-end;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: var(--color-subtle);
}

.announcement-list {
}

.announcement-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.2rem;
  background: var(--color-surface-soft);
}

.card-header {
  margin-bottom: 0.8rem;
}

.announcement-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
}

.card-actions {
}

.announcement-content {
  margin: 0 0 0.8rem 0;
  line-height: 1.6;
  color: var(--color-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.announcement-meta {
  font-size: 0.85rem;
  color: var(--color-subtle);
}

/* 表单样式 */

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  font-weight: 500;
  color: var(--color-ink);
}

.form-group textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.8rem;
  font-size: 1rem;
  font-family: inherit;
  background: var(--color-surface-soft);
  color: var(--color-ink);
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
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

}
</style>
