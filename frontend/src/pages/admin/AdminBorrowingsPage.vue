<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseAlert from '@/components/base/BaseAlert.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { useAdminStore } from '@/stores/admin'
import { useLibraryStore } from '@/stores/library'
import type { BorrowingStatus } from '@/types/library'
import type { BorrowingRecord } from '@/types/library'
import { borrowingService } from '@/services/borrowingService'

const adminStore = useAdminStore()
const libraryStore = useLibraryStore()
const { t, locale } = useI18n()

const statusFilter = ref<'all' | BorrowingStatus>('all')

// 编辑模态框状态
const isEditModalOpen = ref(false)
const editingRecord = ref<BorrowingRecord | null>(null)
const isSubmitting = ref(false)
const submitError = ref('')

// 表单数据
const formData = ref({
  borrowDate: '',
  dueDate: '',
  status: '' as BorrowingStatus
})

// 打开编辑模态框
const openEditModal = (record: BorrowingRecord) => {
  editingRecord.value = record
  // 将记录数据填充到表单中
  formData.value = {
    borrowDate: record.borrowDate,
    dueDate: record.dueDate,
    status: record.status
  }
  isEditModalOpen.value = true
  submitError.value = ''
}

// 关闭编辑模态框
const closeEditModal = () => {
  isEditModalOpen.value = false
  editingRecord.value = null
  submitError.value = ''
}

// 格式化日期时间为带时区的ISO字符串（支持精确到秒）
const formatDateTimeForApi = (dateTimeStr: string): string => {
  const date = new Date(dateTimeStr)
  return date.toISOString()
}

// 提交表单更新借阅记录
const submitForm = async () => {
  if (!editingRecord.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    // 构建更新参数
    const updateParams = {
      borrowDate: formatDateTimeForApi(formData.value.borrowDate),
      dueDate: formatDateTimeForApi(formData.value.dueDate),
      status: formData.value.status
    }

    // 调用服务更新借阅记录
    await borrowingService.updateBorrowingRecord(editingRecord.value.id, updateParams)

    // 更新成功后刷新借阅记录列表
    await adminStore.fetchBorrowings()

    // 关闭模态框
    closeEditModal()
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : '更新借阅记录失败'
    console.error('Failed to update borrowing record:', error)
  } finally {
    isSubmitting.value = false
  }
}

const borrowingRows = computed(() =>
  adminStore.borrowings
    .filter((record) => statusFilter.value === 'all' || record.status === statusFilter.value)
    .map((record) => {
      const book = libraryStore.getBookById(record.bookId)
      const user = adminStore.users.find((u) => u.id === record.userId)
      const bookTitle =
        locale.value === 'en' && book?.titleEn ? book.titleEn : book?.title ?? record.bookId
      return { record, bookTitle, userName: user?.name ?? record.userId }
    }),
)

const statusBadge = (status: BorrowingStatus) => {
  switch (status) {
    case 'active':
      return { text: t('admin.borrowings.status.active'), variant: 'info' as const }
    case 'returned':
      return { text: t('admin.borrowings.status.returned'), variant: 'success' as const }
    case 'overdue':
      return { text: t('admin.borrowings.status.overdue'), variant: 'error' as const }
    default:
      return { text: status, variant: 'neutral' as const }
  }
}

const reload = () => {
  adminStore.fetchBorrowings()
  libraryStore.fetchBooks(true)
}

onMounted(() => {
  libraryStore.fetchBooks()
  adminStore.fetchUsers()
  adminStore.fetchBorrowings()
})
</script>

<template>
  <BaseCard padding="sm" radius="lg" shadow="none">
    <div class="panel-head">
      <div>
        <p class="eyebrow">{{ t('admin.borrowings.title') }}</p>
        <h2>{{ t('admin.borrowings.title') }}</h2>
      </div>
      <div class="actions">
        <select v-model="statusFilter">
          <option value="all">{{ t('admin.users.filterAll') }}</option>
          <option value="active">{{ t('admin.borrowings.status.active') || '借阅中' }}</option>
          <option value="returned">{{ t('admin.borrowings.status.returned') || '已归还' }}</option>
          <option value="overdue">{{ t('admin.borrowings.status.overdue') || '逾期' }}</option>
        </select>
        <BaseButton type="button" variant="ghost" size="sm" @click="reload">
          {{ t('admin.users.refresh') }}
        </BaseButton>
      </div>
    </div>

    <div v-if="adminStore.borrowingsLoading" class="hint">{{ t('admin.borrowings.loading') }}</div>
    <BaseAlert v-else-if="adminStore.borrowingsError" variant="error">
      {{ adminStore.borrowingsError }}
    </BaseAlert>
    <div v-else class="table">
      <div class="table-head">
        <span>{{ t('admin.borrowings.columns.book') }}</span>
        <span>{{ t('admin.borrowings.columns.user') }}</span>
        <span>{{ t('admin.borrowings.columns.borrowDate') }}</span>
        <span>{{ t('admin.borrowings.columns.dueDate') }}</span>
        <span>{{ t('admin.borrowings.columns.status') }}</span>
      </div>
      <div v-for="item in borrowingRows" :key="item.record.id" class="table-row">
        <span>{{ item.bookTitle }}</span>
        <span>{{ item.userName }}</span>
        <span>{{ item.record.borrowDate }}</span>
        <span>{{ item.record.dueDate }}</span>
        <BaseBadge :variant="statusBadge(item.record.status).variant" size="sm">
          {{ statusBadge(item.record.status).text }}
        </BaseBadge>
        <BaseButton
          type="button"
          variant="secondary"
          size="sm"
          @click="openEditModal(item.record)"
          title="编辑借阅记录"
        >
          {{ t('common.edit') }}
        </BaseButton>
      </div>
      <p v-if="!borrowingRows.length" class="hint">{{ t('admin.borrowings.empty') }}</p>
    </div>
  </BaseCard>

  <BaseModal
    :open="isEditModalOpen"
    :title="t('admin.borrowings.editTitle') || 'Edit Borrowing Record'"
    @close="closeEditModal"
  >
    <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

    <div class="form-group">
      <label for="borrowDate">{{ t('admin.borrowings.columns.borrowDate') }}</label>
      <BaseInput type="datetime-local" id="borrowDate" v-model="formData.borrowDate" required />
      <small>{{ t('admin.borrowings.editHint.borrowDate') || '支持精确到秒的时间修改' }}</small>
    </div>

    <div class="form-group">
      <label for="dueDate">{{ t('admin.borrowings.columns.dueDate') }}</label>
      <BaseInput type="datetime-local" id="dueDate" v-model="formData.dueDate" required />
    </div>

    <div class="form-group">
      <label for="status">{{ t('admin.borrowings.columns.status') }}</label>
      <select id="status" v-model="formData.status" required>
        <option value="active">{{ t('admin.borrowings.status.active') || '借阅中' }}</option>
        <option value="returned">{{ t('admin.borrowings.status.returned') || '已归还' }}</option>
        <option value="overdue">{{ t('admin.borrowings.status.overdue') || '逾期' }}</option>
      </select>
    </div>

    <template #footer>
      <BaseButton type="button" variant="secondary" :disabled="isSubmitting" @click="closeEditModal">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton type="button" variant="primary" :disabled="isSubmitting" @click="submitForm">
        {{ isSubmitting ? (t('common.saving') || 'Saving...') : t('common.save') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  color: #8a8e99;
  margin: 0 0 0.25rem;
}

.panel-head h2 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

select {
  border: 1px solid rgba(15, 17, 21, 0.1);
  border-radius: 10px;
  padding: 0.5rem;
  background: rgba(249, 250, 255, 0.8);
}

.table {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1fr 1fr 0.8fr;
  gap: 0.6rem;
  align-items: center;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  color: #1f1f25;
}

.form-group select {
  width: 100%;
  border: 1px solid rgba(15, 17, 21, 0.1);
  border-radius: 10px;
  padding: 0.7rem;
  background: rgba(249, 250, 255, 0.8);
  font-size: 1rem;
}

.form-group small {
  display: block;
  margin-top: 0.2rem;
  color: #6c6f78;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .table-head,
  .table-row {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}

.table-head {
  font-weight: 600;
  color: #4c4f59;
}

.table-row {
  padding: 0.7rem;
  border: 1px solid rgba(15, 17, 21, 0.05);
  border-radius: 12px;
}

.hint {
  color: #6c6f78;
  font-size: 0.95rem;
}

@media (max-width: 900px) {
  .table-head,
  .table-row {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
