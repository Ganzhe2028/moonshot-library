<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAdminStore } from '@/stores/admin'
import { useLibraryStore } from '@/stores/library'
import type { Book, BorrowingStatus } from '@/types/library'

const adminStore = useAdminStore()
const libraryStore = useLibraryStore()
const { t, locale } = useI18n()

const statusFilter = ref<'all' | BorrowingStatus>('all')

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
          <option value="active">{{ t('borrowings.currentTab') }}</option>
          <option value="returned">{{ t('borrowings.return') }}</option>
          <option value="overdue">{{ t('admin.borrowings.overdue') || 'Overdue' }}</option>
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
      </div>
      <p v-if="!borrowingRows.length" class="hint">{{ t('admin.borrowings.empty') }}</p>
    </div>
  </section>
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
  grid-template-columns: 2fr 1.2fr 1fr 1fr 1fr;
  gap: 0.6rem;
  align-items: center;
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
