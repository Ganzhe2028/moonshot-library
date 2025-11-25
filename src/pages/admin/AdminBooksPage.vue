<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as XLSX from 'xlsx'

import { useLibraryStore } from '@/stores/library'
import type { BookImportResult, BookStatus } from '@/types/library'

const libraryStore = useLibraryStore()

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
  authors: '',
  category: '',
  totalCopies: 1,
  availableCopies: 1,
  status: 'available' as BookStatus,
  tags: '',
  isbn: '',
  publisher: '',
  publishedYear: '',
  location: '',
  description: '',
})

const statusOptions: { value: BookStatus; label: string }[] = [
  { value: 'available', label: '可借阅' },
  { value: 'borrowed', label: '借出中' },
  { value: 'reserved', label: '已预约' },
  { value: 'maintenance', label: '维护中' },
]

const books = computed(() => libraryStore.books)

const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    title: '',
    authors: '',
    category: '',
    totalCopies: 1,
    availableCopies: 1,
    status: 'available' as BookStatus,
    tags: '',
    isbn: '',
    publisher: '',
    publishedYear: '',
    location: '',
    description: '',
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
    authors: book.authors.join(', '),
    category: book.category,
    totalCopies: book.totalCopies,
    availableCopies: book.availableCopies,
    status: book.status,
    tags: (book.tags || []).join(', '),
    isbn: book.isbn || '',
    publisher: book.publisher || '',
    publishedYear: book.publishedYear ?? '',
    location: book.location || '',
    description: book.description || '',
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
    authors: parseList(form.authors),
    category: form.category.trim(),
    totalCopies: Number(form.totalCopies),
    availableCopies: form.availableCopies !== null ? Number(form.availableCopies) : undefined,
    status: form.status,
    tags: parseList(form.tags),
    isbn: form.isbn.trim() || undefined,
    publisher: form.publisher.trim() || undefined,
    publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
    location: form.location.trim() || undefined,
    description: form.description.trim() || undefined,
  }

  if (!payload.title || !payload.authors.length || !payload.category) {
    messageVariant.value = 'error'
    message.value = '请填写标题、作者和分类。'
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
  const confirmed = window.confirm('确认删除该书籍？删除后不可恢复。')
  if (!confirmed) return
  const result = await libraryStore.deleteBook(bookId)
  messageVariant.value = result.success ? 'success' : 'error'
  message.value = result.message
}

const statusBadge = (status: BookStatus) => {
  switch (status) {
    case 'available':
      return { text: '可借阅', className: 'green' }
    case 'borrowed':
      return { text: '借出中', className: 'amber' }
    case 'reserved':
      return { text: '已预约', className: 'orange' }
    case 'maintenance':
      return { text: '维护中', className: 'gray' }
    default:
      return { text: status, className: '' }
  }
}

const reload = () => libraryStore.fetchBooks(true)

const triggerFilePicker = () => fileInputRef.value?.click()

const downloadTemplate = () => {
  const headers = [
    'Title',
    'Authors',
    'Category',
    'TotalCopies',
    'AvailableCopies',
    'Status',
    'Tags',
    'ISBN',
    'Publisher',
    'PublishedYear',
    'Location',
    'Description',
  ]
  const sample = [
    '人工智能导论',
    '张三，李四',
    '计算机科学',
    '5',
    '5',
    'available',
    'AI，教材',
    '9787111123456',
    '机械工业出版社',
    `${new Date().getFullYear()}`,
    'A区-101',
    '经典的AI入门读物',
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
    <section class="panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">图书</p>
          <h2>馆藏列表</h2>
        </div>
        <div class="actions">
          <button type="button" class="ghost" @click="reload">刷新</button>
          <button type="button" class="primary" @click="startCreate">新建书籍</button>
        </div>
      </div>

      <div class="import-strip">
        <div>
          <p class="eyebrow">批量导入</p>
          <p class="hint">
            下载 Excel 模板填写后上传，一次导入多本书（支持 .xlsx/.xls，兼容 CSV）。
            字段支持：标题、作者、分类、总册数、可用册数、状态、标签、ISBN、出版社、出版年份、位置、简介。
          </p>
          <div class="import-actions">
            <button type="button" class="ghost" @click="downloadTemplate">下载模板</button>
            <button type="button" class="primary" :disabled="importLoading" @click="triggerFilePicker">
              {{ importLoading ? '正在导入...' : '上传文件' }}
            </button>
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls"
              class="sr-only"
              @change="handleFileChange"
            />
          </div>
          <p v-if="importFileName" class="hint file-name">已选择：{{ importFileName }}</p>
          <p v-if="importError" class="alert error">{{ importError }}</p>
          <div v-if="importResult" class="import-result alert success">
            <p>
              导入成功 {{ importResult.imported }} 条，
              失败 {{ importResult.failed }} 条 / 共 {{ importResult.total }} 条。
            </p>
            <ul v-if="importResult.errors.length" class="error-list">
              <li v-for="error in importResult.errors.slice(0, 3)" :key="error.row">
                第 {{ error.row }} 行：{{ error.message }}
              </li>
              <li v-if="importResult.errors.length > 3">
                其余 {{ importResult.errors.length - 3 }} 条错误请检查文件。
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="libraryStore.booksLoading" class="hint">正在加载图书数据...</div>
      <div v-else class="table">
        <div class="table-head">
          <span>标题</span>
          <span>分类</span>
          <span>库存</span>
          <span>状态</span>
          <span class="actions-col">操作</span>
        </div>
        <div v-for="book in books" :key="book.id" class="table-row">
          <div>
            <p class="book-title">{{ book.title }}</p>
            <p class="book-meta">{{ book.authors.join(' / ') }}</p>
          </div>
          <span>{{ book.category }}</span>
          <span>{{ book.availableCopies }} / {{ book.totalCopies }}</span>
          <span :class="['pill', statusBadge(book.status).className]">
            {{ statusBadge(book.status).text }}
          </span>
          <div class="actions">
            <button type="button" class="ghost" @click="startEdit(book.id)">编辑</button>
            <button type="button" class="ghost danger" @click="handleDelete(book.id)">删除</button>
          </div>
        </div>
        <p v-if="!books.length" class="hint">还没有数据，请新建书籍。</p>
      </div>
    </section>

    <section class="panel form-panel" v-if="showForm">
      <div class="panel-head">
        <div>
          <p class="eyebrow">表单</p>
          <h2>{{ editingId ? '编辑书籍' : '新建书籍' }}</h2>
        </div>
        <button type="button" class="ghost" @click="showForm = false">关闭</button>
      </div>

      <form class="form" @submit.prevent="handleSubmit">
        <label>
          标题
          <input v-model="form.title" type="text" placeholder="书名" required />
        </label>
        <label>
          作者（用逗号分隔）
          <input v-model="form.authors" type="text" placeholder="作者1, 作者2" required />
        </label>
        <label>
          分类
          <input v-model="form.category" type="text" placeholder="如：计算机科学" required />
        </label>

        <div class="two-cols">
          <label>
            总册数
            <input v-model.number="form.totalCopies" type="number" min="1" />
          </label>
          <label>
            可用册数
            <input v-model.number="form.availableCopies" type="number" min="0" />
          </label>
        </div>

        <label>
          状态
          <select v-model="form.status">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label>
          标签（逗号分隔）
          <input v-model="form.tags" type="text" placeholder="AI, 教材, 工具书" />
        </label>

        <div class="two-cols">
          <label>
            ISBN
            <input v-model="form.isbn" type="text" />
          </label>
          <label>
            出版社
            <input v-model="form.publisher" type="text" />
          </label>
        </div>

        <div class="two-cols">
          <label>
            出版年份
            <input v-model="form.publishedYear" type="number" min="1900" max="2100" />
          </label>
          <label>
            馆藏位置
            <input v-model="form.location" type="text" placeholder="A区-101" />
          </label>
        </div>

        <label>
          简介
          <textarea v-model="form.description" rows="3" placeholder="简要介绍" />
        </label>

        <button type="submit" class="primary">
          {{ editingId ? '保存修改' : '创建书籍' }}
        </button>
      </form>

    </section>
  </div>
  <p v-if="message" :class="['alert', messageVariant]">{{ message }}</p>
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

.actions {
  display: flex;
  gap: 0.5rem;
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

.primary {
  background: linear-gradient(120deg, #4338ca, #6366f1);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 0.65rem 1rem;
  font-weight: 600;
}

.ghost {
  background: rgba(15, 17, 21, 0.05);
  border: 1px solid rgba(15, 17, 21, 0.06);
  border-radius: 10px;
  padding: 0.5rem 0.8rem;
  color: #1f1f25;
}

.ghost.danger {
  color: #b91c1c;
  border-color: rgba(185, 28, 28, 0.3);
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
  color: #4c4f59;
}

.table-row {
  padding: 0.7rem;
  border: 1px solid rgba(15, 17, 21, 0.05);
  border-radius: 12px;
}

.book-title {
  margin: 0;
  font-weight: 600;
}

.book-meta {
  margin: 0.1rem 0 0;
  color: #6c6f78;
  font-size: 0.9rem;
}

.actions-col {
  text-align: right;
}

.actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}

.pill {
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.85rem;
  text-align: center;
}

.pill.green {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.pill.amber {
  background: rgba(251, 191, 36, 0.18);
  color: #92400e;
}

.pill.orange {
  background: rgba(248, 113, 113, 0.18);
  color: #b91c1c;
}

.pill.gray {
  background: rgba(107, 114, 128, 0.15);
  color: #374151;
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
  color: #1f2937;
}

input,
textarea,
select {
  border: 1px solid rgba(15, 17, 21, 0.1);
  border-radius: 10px;
  padding: 0.65rem;
  background: rgba(249, 250, 255, 0.8);
}

.two-cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.alert {
  margin-top: 0.5rem;
  padding: 0.65rem 0.8rem;
  border-radius: 10px;
  font-size: 0.95rem;
}

.alert.success {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.alert.error {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.import-strip {
  margin-bottom: 0.8rem;
  padding: 0.75rem;
  border: 1px dashed rgba(67, 56, 202, 0.3);
  border-radius: 12px;
  background: rgba(67, 56, 202, 0.05);
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
  color: #92400e;
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
  color: #6c6f78;
  font-size: 0.95rem;
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
