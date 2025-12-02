<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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
      return { text: t('admin.borrowings.status.active'), className: 'blue' }
    case 'returned':
      return { text: t('admin.borrowings.status.returned'), className: 'green' }
    case 'overdue':
      return { text: t('admin.borrowings.status.overdue'), className: 'red' }
    default:
      return { text: status, className: 'gray' }
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
  <section class="panel">
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
        <button type="button" class="ghost" @click="reload">{{ t('admin.users.refresh') }}</button>
      </div>
    </div>

    <div v-if="adminStore.borrowingsLoading" class="hint">{{ t('admin.borrowings.loading') }}</div>
    <p v-else-if="adminStore.borrowingsError" class="alert error">{{ adminStore.borrowingsError }}</p>
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
        <span :class="['pill', statusBadge(item.record.status).className]">
          {{ statusBadge(item.record.status).text }}
        </span>
        <button
          type="button"
          class="edit-btn"
          @click="openEditModal(item.record)"
          title="编辑借阅记录"
        >
          {{ t('common.edit') }}
        </button>
      </div>
      <p v-if="!borrowingRows.length" class="hint">{{ t('admin.borrowings.empty') }}</p>
      </div>
    </section>

    <!-- 编辑借阅记录模态框 -->
    <div v-if="isEditModalOpen" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ t('admin.borrowings.editTitle') || 'Edit Borrowing Record' }}</h3>
          <button type="button" class="close-btn" @click="closeEditModal" aria-label="Close">×</button>
        </div>

        <div class="modal-body">
          <p v-if="submitError" class="alert error">{{ submitError }}</p>

          <div class="form-group">
            <label for="borrowDate">{{ t('admin.borrowings.columns.borrowDate') }}</label>
            <input
              type="datetime-local"
              id="borrowDate"
              v-model="formData.borrowDate"
              required
            >
            <small>{{ t('admin.borrowings.editHint.borrowDate') || '支持精确到秒的时间修改' }}</small>
          </div>

          <div class="form-group">
            <label for="dueDate">{{ t('admin.borrowings.columns.dueDate') }}</label>
            <input
              type="datetime-local"
              id="dueDate"
              v-model="formData.dueDate"
              required
            >
          </div>

          <div class="form-group">
            <label for="status">{{ t('admin.borrowings.columns.status') }}</label>
            <select id="status" v-model="formData.status" required>
            <option value="active">{{ t('admin.borrowings.status.active') || '借阅中' }}</option>
            <option value="returned">{{ t('admin.borrowings.status.returned') || '已归还' }}</option>
            <option value="overdue">{{ t('admin.borrowings.status.overdue') || '逾期' }}</option>
          </select>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="cancel-btn"
              @click="closeEditModal"
              :disabled="isSubmitting"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="submit-btn"
              @click="submitForm"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? (t('common.saving') || 'Saving...') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>

<style scoped>
.panel {
  border: 1px solid rgba(15, 17, 21, 0.05);
  border-radius: 18px;
  padding: 1rem;
  background: #fff;
}

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

.panel h2 {
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

.ghost {
  background: rgba(15, 17, 21, 0.05);
  border: 1px solid rgba(15, 17, 21, 0.06);
  border-radius: 10px;
  padding: 0.5rem 0.8rem;
  color: #1f1f25;
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

.edit-btn {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  color: #1d4ed8;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(15, 17, 21, 0.05);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c6f78;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: rgba(15, 17, 21, 0.05);
}

.modal-body {
  padding: 1.5rem;
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid rgba(15, 17, 21, 0.1);
  border-radius: 10px;
  background: rgba(249, 250, 255, 0.8);
  font-size: 1rem;
}

.form-group small {
  display: block;
  margin-top: 0.2rem;
  color: #6c6f78;
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.cancel-btn,
.submit-btn {
  padding: 0.7rem 1.2rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.cancel-btn {
  background: rgba(15, 17, 21, 0.05);
  color: #6c6f78;
  border-color: rgba(15, 17, 21, 0.06);
}

.cancel-btn:hover {
  background: rgba(15, 17, 21, 0.08);
}

.submit-btn {
  background: #1d4ed8;
  color: white;
  border-color: #1d4ed8;
}

.submit-btn:hover:not(:disabled) {
  background: #1e40af;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .table-head,
  .table-row {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }

  .edit-btn {
    padding: 0.2rem 0.4rem;
    font-size: 0.75rem;
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

.pill {
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.85rem;
  text-align: center;
}

.pill.blue {
  background: rgba(59, 130, 246, 0.14);
  color: #1d4ed8;
}

.pill.green {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.pill.red {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.pill.gray {
  background: rgba(107, 114, 128, 0.15);
  color: #374151;
}

.alert {
  margin-top: 0.5rem;
  padding: 0.65rem 0.8rem;
  border-radius: 10px;
  font-size: 0.95rem;
}

.alert.error {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
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
