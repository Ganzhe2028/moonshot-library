<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as XLSX from 'xlsx'
import { useI18n } from 'vue-i18n'

import BaseAlert from '@/components/base/BaseAlert.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { useLibraryStore } from '@/stores/library'
import type { Book, BookImportResult, BookStatus } from '@/types/library'

const libraryStore = useLibraryStore()
const { t, locale } = useI18n()

const editingId = ref<string | null>(null)
const message = ref('')
const messageVariant = ref<'success' | 'error'>('success')
const showForm = ref(false)
const importResult = ref<BookImportResult | null>(null)
const importError = ref('')
const importLoading = ref(false)
const importFileName = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  title: '',
  titleEn: '',
  authors: '',
  authorsEn: '',
  category: '',
  categoryEn: '',
  totalCopies: 1,
  availableCopies: 1,
  status: 'available' as BookStatus,
  tags: '',
  tagsEn: '',
  isbn: '',
  publisher: '',
  publisherEn: '',
  publishedYear: '',
  location: '',
  description: '',
  word_count: '',
  descriptionEn: '',
})

const statusOptions: { value: BookStatus; label: string }[] = [
  { value: 'available', label: t('admin.books.status.available') },
  { value: 'borrowed', label: t('admin.books.status.borrowed') },
  { value: 'reserved', label: t('admin.books.status.reserved') },
  { value: 'maintenance', label: t('admin.books.status.maintenance') },
]

const books = computed(() => libraryStore.books)

const titleForLocale = (book: Book) =>
  locale.value === 'en' && book.titleEn ? book.titleEn : book.title

const authorsForLocale = (book: Book) =>
  locale.value === 'en' && book.authorsEn?.length ? book.authorsEn : book.authors || []

const categoryForLocale = (book: Book) =>
  locale.value === 'en' && book.categoryEn ? book.categoryEn : book.category

const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    title: '',
    titleEn: '',
    authors: '',
    authorsEn: '',
    category: '',
    categoryEn: '',
    totalCopies: 1,
    availableCopies: 1,
    status: 'available' as BookStatus,
    tags: '',
    tagsEn: '',
    isbn: '',
    publisher: '',
    publisherEn: '',
    publishedYear: '',
    location: '',
    description: '',
    word_count: '',
    descriptionEn: '',
  })
}

const startCreate = () => {
  showForm.value = true
  resetForm()
}

const startEdit = (bookId: string) => {
  const book = libraryStore.getBookById(bookId)
  if (!book) return
  showForm.value = true
  editingId.value = bookId
  Object.assign(form, {
    title: book.title,
    titleEn: book.titleEn || '',
    authors: book.authors.join(', '),
    authorsEn: (book.authorsEn || []).join(', '),
    category: book.category,
    categoryEn: book.categoryEn || '',
    totalCopies: book.totalCopies,
    availableCopies: book.availableCopies,
    status: book.status,
    tags: (book.tags || []).join(', '),
    tagsEn: (book.tagsEn || []).join(', '),
    isbn: book.isbn || '',
    publisher: book.publisher || '',
    publisherEn: book.publisherEn || '',
    publishedYear: book.publishedYear ?? '',
    location: book.location || '',
    description: book.description || '',
    descriptionEn: book.descriptionEn || '',
  })
}

const parseList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const handleSubmit = async () => {
  const payload = {
    title: form.title.trim(),
    titleEn: form.titleEn.trim(),
    authors: parseList(form.authors),
    authorsEn: parseList(form.authorsEn),
    category: form.category.trim(),
    categoryEn: form.categoryEn.trim(),
    totalCopies: Number(form.totalCopies),
    availableCopies: form.availableCopies !== null ? Number(form.availableCopies) : undefined,
    status: form.status,
    tags: parseList(form.tags),
    tagsEn: parseList(form.tagsEn),
    isbn: form.isbn.trim() || undefined,
    publisher: form.publisher.trim() || undefined,
    publisherEn: form.publisherEn.trim() || undefined,
    publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
    location: form.location.trim() || undefined,
    description: form.description.trim() || undefined,
    word_count: form.word_count ? Number(form.word_count) : undefined,
    descriptionEn: form.descriptionEn.trim() || undefined,
  }

  if (!payload.title || !payload.authors.length || !payload.category) {
    messageVariant.value = 'error'
    message.value = t('admin.books.form.required')
    return
  }

  const result = editingId.value
    ? await libraryStore.updateBook(editingId.value, payload)
    : await libraryStore.createBook(payload)

  messageVariant.value = result.success ? 'success' : 'error'
  message.value = result.message

  if (result.success) {
    resetForm()
    showForm.value = false
  }
}

const handleDelete = async (bookId: string) => {
  const confirmed = window.confirm(t('admin.books.confirmDelete'))
  if (!confirmed) return
  const result = await libraryStore.deleteBook(bookId)
  messageVariant.value = result.success ? 'success' : 'error'
  message.value = result.message
}

const statusBadge = (status: BookStatus) => {
  switch (status) {
    case 'available':
      return { text: t('admin.books.status.available'), variant: 'success' as const }
    case 'borrowed':
      return { text: t('admin.books.status.borrowed'), variant: 'warning' as const }
    case 'reserved':
      return { text: t('admin.books.status.reserved'), variant: 'warning' as const }
    case 'maintenance':
      return { text: t('admin.books.status.maintenance'), variant: 'neutral' as const }
    default:
      return { text: status, variant: 'neutral' as const }
  }
}

const reload = () => libraryStore.fetchBooks(true)

const triggerFilePicker = () => fileInputRef.value?.click()

const downloadTemplate = () => {
  const headers = [
    'Title',
    'TitleEn',
    'Authors',
    'AuthorsEn',
    'Category',
    'CategoryEn',
    'TotalCopies',
    'AvailableCopies',
    'Status',
    'Tags',
    'TagsEn',
    'ISBN',
    'Publisher',
    'PublisherEn',
    'PublishedYear',
    'Location',
    'Description',
    'DescriptionEn',
  ]
  const sample = [
    '人工智能导论',
    'Introduction to Artificial Intelligence',
    '张三，李四',
    'Zhang San, Li Si',
    '计算机科学',
    'Computer Science',
    '5',
    '5',
    'available',
    'AI，教材',
    'AI, Textbook',
    '9787111123456',
    '机械工业出版社',
    'Mechanical Industry Press',
    `${new Date().getFullYear()}`,
    'A区-101',
    '经典的AI入门读物',
    'A classic AI primer',
  ]
  const worksheet = XLSX.utils.aoa_to_sheet([headers, sample])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '模板')
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'books-import-template.xlsx'
  link.click()
  URL.revokeObjectURL(link.href)
}

const importFile = async (file: File) => {
  importLoading.value = true
  importError.value = ''
  importResult.value = null
  importFileName.value = file.name
  message.value = ''

  const result = await libraryStore.importBooks(file)
  importLoading.value = false

  messageVariant.value = result.success ? 'success' : 'error'
  message.value = result.message

  if (result.success && result.result) {
    importResult.value = result.result
  } else {
    importError.value = result.message
  }
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await importFile(file)
  }
  if (target) {
    target.value = ''
  }
}

onMounted(() => {
  libraryStore.fetchBooks()
})
</script>

<template>
  <div :class="['grid', { single: !showForm }]">
    <BaseCard padding="sm" radius="lg" shadow="none">
      <div class="panel-head">
        <div>
          <p class="eyebrow">{{ t('admin.books.listTitle') }}</p>
          <h2>{{ t('admin.books.listTitle') }}</h2>
        </div>
        <div class="head-actions">
          <BaseButton type="button" variant="ghost" size="sm" @click="reload">
            {{ t('admin.books.refresh') }}
          </BaseButton>
          <BaseButton type="button" variant="primary" size="sm" @click="startCreate">
            {{ t('admin.books.create') }}
          </BaseButton>
        </div>
      </div>

      <div class="import-strip">
        <div>
          <p class="eyebrow">{{ t('admin.books.import.title') }}</p>
          <p class="hint">
            {{ t('admin.books.import.hint') }}
          </p>
          <div class="import-actions">
            <BaseButton type="button" variant="ghost" size="sm" @click="downloadTemplate">
              {{ t('admin.books.import.download') }}
            </BaseButton>
            <BaseButton
              type="button"
              variant="primary"
              size="sm"
              :disabled="importLoading"
              @click="triggerFilePicker"
            >
              {{ importLoading ? t('admin.books.import.uploading') : t('admin.books.import.upload') }}
            </BaseButton>
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls"
              class="sr-only"
              @change="handleFileChange"
            />
          </div>
          <p v-if="importFileName" class="hint file-name">
            {{ t('admin.books.import.selected', { name: importFileName }) }}
          </p>
          <BaseAlert v-if="importError" variant="error">{{ importError }}</BaseAlert>
          <BaseAlert v-if="importResult" variant="success" class="import-result">
            <p>
              {{
                t('admin.books.import.result', {
                  imported: importResult.imported,
                  failed: importResult.failed,
                  total: importResult.total,
                })
              }}
            </p>
            <ul v-if="importResult.errors.length" class="error-list">
              <li v-for="error in importResult.errors.slice(0, 3)" :key="error.row">
                {{ error.row }} : {{ error.message }}
              </li>
              <li v-if="importResult.errors.length > 3">
                {{ t('admin.books.import.moreErrors', { count: importResult.errors.length - 3 }) }}
              </li>
            </ul>
          </BaseAlert>
        </div>
      </div>

      <div v-if="libraryStore.booksLoading" class="hint">{{ t('admin.books.loading') || '...' }}</div>
      <div v-else class="table">
        <div class="table-head">
          <span>{{ t('admin.books.table.title') }}</span>
          <span>{{ t('admin.books.table.category') }}</span>
          <span>{{ t('admin.books.table.stock') }}</span>
          <span>{{ t('admin.books.table.status') }}</span>
          <span class="actions-col">{{ t('admin.books.table.actions') }}</span>
        </div>
        <div v-for="book in books" :key="book.id" class="table-row">
          <div>
            <p class="book-title">{{ titleForLocale(book) }}</p>
            <p class="book-meta">{{ authorsForLocale(book).join(' / ') }}</p>
          </div>
          <span>{{ categoryForLocale(book) }}</span>
          <span>{{ book.availableCopies }} / {{ book.totalCopies }}</span>
          <BaseBadge :variant="statusBadge(book.status).variant">
            {{ statusBadge(book.status).text }}
          </BaseBadge>
          <div class="row-actions">
            <BaseButton type="button" variant="ghost" size="sm" @click="startEdit(book.id)">
              {{ t('admin.books.edit') }}
            </BaseButton>
            <BaseButton type="button" variant="danger" size="sm" @click="handleDelete(book.id)">
              {{ t('admin.books.delete') }}
            </BaseButton>
          </div>
        </div>
        <p v-if="!books.length" class="hint">{{ t('admin.books.table.empty') }}</p>
      </div>
    </BaseCard>

    <BaseCard v-if="showForm" class="form-panel" padding="sm" radius="lg" shadow="none">
      <div class="panel-head">
        <div>
          <p class="eyebrow">{{ t('admin.books.formTitleCreate') }}</p>
          <h2>{{ editingId ? t('admin.books.formTitleEdit') : t('admin.books.formTitleCreate') }}</h2>
        </div>
        <BaseButton type="button" variant="ghost" size="sm" @click="showForm = false">
          {{ t('admin.books.closeForm') }}
        </BaseButton>
      </div>

      <form class="form" @submit.prevent="handleSubmit">
        <p class="hint note">{{ t('admin.books.form.bilingualHint') }}</p>
        <label>
          {{ t('admin.books.form.title') }}
          <input v-model="form.title" type="text" :placeholder="t('admin.books.form.title')" required />
        </label>
        <label>
          {{ t('admin.books.form.titleEn') }}
          <input v-model="form.titleEn" type="text" :placeholder="t('admin.books.form.titleEn')" />
        </label>
        <label>
          {{ t('admin.books.form.authors') }}
          <input v-model="form.authors" type="text" :placeholder="t('admin.books.form.authors')" required />
        </label>
        <label>
          {{ t('admin.books.form.authorsEn') }}
          <input v-model="form.authorsEn" type="text" :placeholder="t('admin.books.form.authorsEn')" />
        </label>
        <label>
          {{ t('admin.books.form.category') }}
          <input v-model="form.category" type="text" :placeholder="t('admin.books.form.category')" required />
        </label>
        <label>
          {{ t('admin.books.form.categoryEn') }}
          <input v-model="form.categoryEn" type="text" :placeholder="t('admin.books.form.categoryEn')" />
        </label>

        <div class="two-cols">
          <label>
            {{ t('admin.books.form.total') }}
            <input v-model.number="form.totalCopies" type="number" min="1" />
          </label>
          <label>
            {{ t('admin.books.form.available') }}
            <input v-model.number="form.availableCopies" type="number" min="0" />
          </label>
        </div>

        <label>
          {{ t('admin.books.form.status') }}
          <select v-model="form.status">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label>
          {{ t('admin.books.form.tags') }}
          <input v-model="form.tags" type="text" :placeholder="t('admin.books.form.tags')" />
        </label>
        <label>
          {{ t('admin.books.form.tagsEn') }}
          <input v-model="form.tagsEn" type="text" :placeholder="t('admin.books.form.tagsEn')" />
        </label>

        <div class="two-cols">
          <label>
            ISBN
            <input v-model="form.isbn" type="text" />
          </label>
          <label>
            {{ t('admin.books.form.publisher') }}
            <input v-model="form.publisher" type="text" />
          </label>
        </div>

        <label>
          {{ t('admin.books.form.publisherEn') }}
          <input v-model="form.publisherEn" type="text" />
        </label>

        <div class="two-cols">
          <label>
            {{ t('admin.books.form.year') }}
            <input v-model="form.publishedYear" type="number" min="1900" max="2100" />
          </label>
          <label>
            字数
            <input v-model="form.word_count" type="number" min="0" placeholder="输入书籍字数" />
          </label>
        </div>

        <div class="two-cols">
          <label>
            {{ t('admin.books.form.location') }}
            <input v-model="form.location" type="text" placeholder="A区-101" />
          </label>
        </div>

        <label>
          {{ t('admin.books.form.desc') }}
          <textarea v-model="form.description" rows="3" :placeholder="t('admin.books.form.desc')" />
        </label>
        <label>
          {{ t('admin.books.form.descEn') }}
          <textarea v-model="form.descriptionEn" rows="3" :placeholder="t('admin.books.form.descEn')" />
        </label>

        <BaseButton type="submit" variant="primary" block>
          {{ editingId ? t('admin.books.form.submitUpdate') : t('admin.books.form.submitCreate') }}
        </BaseButton>
      </form>

    </BaseCard>
  </div>
  <BaseAlert v-if="message" :variant="messageVariant">{{ message }}</BaseAlert>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1rem;
}

.grid.single {
  grid-template-columns: 1fr;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.head-actions {
  display: flex;
  gap: 0.5rem;
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

.table {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 0.6rem;
  align-items: center;
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

.book-title {
  margin: 0;
  font-weight: 600;
}

.book-meta {
  margin: 0.1rem 0 0;
  color: var(--color-subtle);
  font-size: var(--text-sm);
}

.actions-col {
  text-align: right;
}

.row-actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}

.form-panel {
  position: sticky;
  top: 1rem;
  align-self: flex-start;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
  color: var(--color-ink);
}

input,
textarea,
select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  padding: 0.65rem;
  background: var(--color-surface-soft);
  color: var(--color-ink);
}

.two-cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.import-strip {
  margin-bottom: 0.8rem;
  padding: 0.75rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--panel-gradient);
}

.import-actions {
  display: flex;
  gap: 0.5rem;
  margin: 0.5rem 0;
  flex-wrap: wrap;
}

.file-name {
  margin: 0.2rem 0 0;
}

.import-result {
  margin-top: 0.5rem;
}

.error-list {
  margin: 0.35rem 0 0;
  padding-left: 1.2rem;
  color: var(--color-warning-strong);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.hint {
  color: var(--color-subtle);
  font-size: var(--text-sm);
}

.note {
  margin: 0 0 0.5rem;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .form-panel {
    position: relative;
    top: 0;
  }

  .table-head,
  .table-row {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
