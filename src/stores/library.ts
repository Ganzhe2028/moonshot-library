import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

import type { Book, BorrowingRecord } from '@/types/library'
import { bookService } from '@/services/bookService'
import { borrowingService } from '@/services/borrowingService'

interface LibraryState {
  books: Book[]
  booksLoading: boolean
  booksError: string
  borrowings: BorrowingRecord[]
  borrowingsLoading: boolean
  borrowingsError: string
}

export const useLibraryStore = defineStore('library', {
  state: (): LibraryState => ({
    books: [],
    booksLoading: false,
    booksError: '',
    borrowings: [],
    borrowingsLoading: false,
    borrowingsError: '',
  }),
  getters: {
    getBookById: (state) => (id: string) => state.books.find((book) => book.id === id),
    activeBorrowings: (state): BorrowingRecord[] =>
      state.borrowings.filter((record) => record.status === 'active'),
    borrowingHistory: (state): BorrowingRecord[] =>
      state.borrowings.filter((record) => record.status !== 'active'),
    isBookBorrowedByUser(): (bookId: string) => boolean {
      return (bookId: string) => this.activeBorrowings.some((record) => record.bookId === bookId)
    },
  },
  actions: {
    async fetchBooks(force = false) {
      if (this.books.length && !force) return
      this.booksLoading = true
      this.booksError = ''
      try {
        const books = await bookService.fetchBooks()
        this.books = books.map((book) => ({
          ...book,
          tags: book.tags ?? [],
        }))
      } catch (err) {
        this.booksError = err instanceof Error ? err.message : '无法加载图书数据'
      } finally {
        this.booksLoading = false
      }
    },
    async createBook(payload: Omit<Book, 'id' | 'availableCopies'> & { availableCopies?: number }) {
      this.booksError = ''
      try {
        const book = await bookService.createBook(payload)
        this.books.unshift({ ...book, tags: book.tags ?? [] })
        return { success: true, message: '已创建新书籍。' }
      } catch (err) {
        const message = err instanceof Error ? err.message : '创建书籍失败'
        this.booksError = message
        return { success: false, message }
      }
    },
    async updateBook(id: string, payload: Partial<Book>) {
      this.booksError = ''
      try {
        const book = await bookService.updateBook(id, payload)
        const index = this.books.findIndex((item) => item.id === id)
        if (index >= 0) {
          this.books.splice(index, 1, { ...book, tags: book.tags ?? [] })
        } else {
          this.books.push({ ...book, tags: book.tags ?? [] })
        }
        return { success: true, message: '书籍信息已更新。' }
      } catch (err) {
        const message = err instanceof Error ? err.message : '更新书籍失败'
        this.booksError = message
        return { success: false, message }
      }
    },
    async deleteBook(id: string) {
      this.booksError = ''
      try {
        await bookService.deleteBook(id)
        this.books = this.books.filter((book) => book.id !== id)
        return { success: true, message: '书籍已删除。' }
      } catch (err) {
        const message = err instanceof Error ? err.message : '删除书籍失败'
        this.booksError = message
        return { success: false, message }
      }
    },
    async fetchBookById(id: string) {
      const existing = this.getBookById(id)
      if (existing) return existing

      this.booksLoading = true
      this.booksError = ''
      try {
        const book = await bookService.fetchBookById(id)
        const index = this.books.findIndex((item) => item.id === book.id)
        if (index >= 0) {
          this.books[index] = book
        } else {
          this.books.push(book)
        }
        return book
      } catch (err) {
        this.booksError = err instanceof Error ? err.message : '无法获取图书信息'
        return null
      } finally {
        this.booksLoading = false
      }
    },
    async fetchBorrowings(force = false) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        this.borrowings = []
        return
      }

      if (this.borrowings.length && !force) return

      this.borrowingsLoading = true
      this.borrowingsError = ''
      try {
        const records = await borrowingService.fetchBorrowings({ userId: authStore.user.id })
        this.borrowings = records
      } catch (err) {
        this.borrowingsError = err instanceof Error ? err.message : '无法加载借阅记录'
      } finally {
        this.borrowingsLoading = false
      }
    },
    async borrowBook(bookId: string) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, message: '请先登录后再借阅图书。' }
      }

      try {
        const targetBook = this.getBookById(bookId)
        if (!targetBook || targetBook.status !== 'available') {
          return { success: false, message: '该图书暂不可借阅。' }
        }

        await this.fetchBorrowings(true)
        if (this.isBookBorrowedByUser(bookId)) {
          return { success: false, message: '你已经借阅了这本书。' }
        }

        await borrowingService.borrowBook(bookId)
        await Promise.all([this.fetchBorrowings(true), this.fetchBooks(true)])
        return { success: true, message: '借阅成功，祝你阅读愉快！' }
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : '借阅失败，请稍后再试。',
        }
      }
    },
    async returnBook(recordId: string) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, message: '请先登录后再归还图书。' }
      }

      try {
        await borrowingService.returnBook(recordId)
        await Promise.all([this.fetchBorrowings(true), this.fetchBooks(true)])
        return { success: true, message: '已归还图书。' }
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : '归还失败，请稍后再试。',
        }
      }
    },
    async renewBorrowing(recordId: string) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, message: '请先登录后再续借图书。' }
      }

      try {
        await borrowingService.renewBorrowing(recordId)
        await this.fetchBorrowings(true)
        return { success: true, message: '续借成功，已延长借阅时间。' }
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : '续借失败，请稍后再试。',
        }
      }
    },
  },
})
