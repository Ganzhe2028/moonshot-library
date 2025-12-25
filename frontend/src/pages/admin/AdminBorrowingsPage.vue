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
import { settingsService } from '@/services/settingsService'

const adminStore = useAdminStore()
const libraryStore = useLibraryStore()
const { t, locale } = useI18n()

const statusFilter = ref<'all' | BorrowingStatus>('all')

const maxActiveBorrowings = ref(5)
const limitLoading = ref(false)
const limitSaving = ref(false)
const limitError = ref('')
const limitSaved = ref(false)

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

const loadBorrowingLimit = async () => {
  limitLoading.value = true
  limitError.value = ''
  limitSaved.value = false
  try {
    maxActiveBorrowings.value = await settingsService.fetchBorrowingLimit()
  } catch (error) {
    limitError.value = error instanceof Error ? error.message : '无法加载借阅上限'
  } finally {
    limitLoading.value = false
  }
}

const saveBorrowingLimit = async () => {
  limitError.value = ''
  limitSaved.value = false
  const parsed = Number.parseInt(String(maxActiveBorrowings.value), 10)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 50) {
    limitError.value = t('admin.borrowings.limitError') || '请输入 1-50 的整数'
    return
  }

  limitSaving.value = true
  try {
    maxActiveBorrowings.value = await settingsService.updateBorrowingLimit(parsed)
    limitSaved.value = true
  } catch (error) {
    limitError.value = error instanceof Error ? error.message : '更新借阅上限失败'
  } finally {
    limitSaving.value = false
  }
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
  loadBorrowingLimit()
})
</script>

<template>
  <BaseCard padding="sm" radius="lg" shadow="none" class="limit-card">
    <div class="panel-head u-split u-wrap">
      <div>
        <p class="eyebrow">{{ t('admin.borrowings.limitTitle') }}</p>
        <h2>{{ t('admin.borrowings.limitTitle') }}</h2>
        <p class="subtitle">{{ t('admin.borrowings.limitSubtitle') }}</p>
      </div>
    </div>

    <div class="limit-form u-inline u-wrap">
      <div class="limit-field">
        <label for="maxActiveBorrowings">{{ t('admin.borrowings.limitLabel') }}</label>
        <BaseInput
          id="maxActiveBorrowings"
          type="number"
          min="1"
          max="50"
          v-model.number="maxActiveBorrowings"
          :disabled="limitLoading || limitSaving"
        />
        <small>{{ t('admin.borrowings.limitHint') }}</small>
      </div>
      <div class="limit-actions u-inline u-inline-sm">
        <BaseButton
          type="button"
          variant="primary"
          size="sm"
          :disabled="limitLoading || limitSaving"
          @click="saveBorrowingLimit"
        >
          {{ limitSaving ? (t('common.saving') || 'Saving...') : t('common.save') }}
        </BaseButton>
      </div>
    </div>

    <BaseAlert v-if="limitError" variant="error">{{ limitError }}</BaseAlert>
    <BaseAlert v-else-if="limitSaved" variant="success">{{ t('admin.borrowings.limitSaved') }}</BaseAlert>
  </BaseCard>

  <BaseCard padding="sm" radius="lg" shadow="none">
    <div class="panel-head u-split u-wrap">
      <div>
        <p class="eyebrow">{{ t('admin.borrowings.title') }}</p>
        <h2>{{ t('admin.borrowings.title') }}</h2>
      </div>
      <div class="actions u-inline u-inline-sm">
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
    <div v-else class="table u-stack-sm">
      <div class="table-head u-grid">
        <span>{{ t('admin.borrowings.columns.book') }}</span>
        <span>{{ t('admin.borrowings.columns.user') }}</span>
        <span>{{ t('admin.borrowings.columns.borrowDate') }}</span>
        <span>{{ t('admin.borrowings.columns.dueDate') }}</span>
        <span>{{ t('admin.borrowings.columns.status') }}</span>
      </div>
      <div v-for="item in borrowingRows" :key="item.record.id" class="table-row u-grid">
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

    <div class="form-group u-stack">
      <label for="borrowDate">{{ t('admin.borrowings.columns.borrowDate') }}</label>
      <BaseInput type="datetime-local" id="borrowDate" v-model="formData.borrowDate" required />
      <small>{{ t('admin.borrowings.editHint.borrowDate') || '支持精确到秒的时间修改' }}</small>
    </div>

    <div class="form-group u-stack">
      <label for="dueDate">{{ t('admin.borrowings.columns.dueDate') }}</label>
      <BaseInput type="datetime-local" id="dueDate" v-model="formData.dueDate" required />
    </div>

    <div class="form-group u-stack">
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
  margin-bottom: 0.5rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: var(--text-xs);
  color: var(--color-subtle);
  margin: 0 0 0.25rem;
}

.panel-head h2 {
  margin: 0;
}

.subtitle {
  margin: 0.3rem 0 0;
  color: var(--color-muted);
}

.actions {
}

select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  padding: 0.5rem;
  background: var(--color-surface-soft);
  color: var(--color-ink);
}

.table {
  gap: var(--space-2);
}

.table-head,
.table-row {
  grid-template-columns: 2fr 1.2fr 1fr 1fr 1fr 0.8fr;
  gap: var(--space-3);
  align-items: center;
}

.form-group {
  margin-bottom: 1.2rem;
  gap: var(--space-2);
}

.form-group label {
  font-weight: 500;
  color: var(--color-ink);
}

.form-group select {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  padding: 0.7rem;
  background: var(--color-surface-soft);
  font-size: 1rem;
}

.form-group small {
  display: block;
  margin-top: 0.2rem;
  color: var(--color-subtle);
  font-size: var(--text-sm);
}

.limit-card {
  margin-bottom: 1rem;
}

.limit-form {
  align-items: flex-end;
}

.limit-field {
  flex: 1 1 240px;
}

.limit-field label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  color: var(--color-ink);
}

.limit-field small {
  display: block;
  margin-top: 0.3rem;
  color: var(--color-subtle);
  font-size: var(--text-sm);
}

.limit-actions {
}

@media (max-width: 768px) {
  .table-head,
  .table-row {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }

  .limit-form {
    align-items: stretch;
  }
}

.table-head {
  font-weight: 600;
  color: var(--color-muted);
}

.table-row {
  padding: 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.hint {
  color: var(--color-subtle);
  font-size: var(--text-sm);
}

@media (max-width: 900px) {
  .table-head,
  .table-row {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
