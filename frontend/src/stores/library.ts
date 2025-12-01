import { defineStore } from 'pinia'
import type { Book, BookImportResult, BorrowingRecord, Rating, Comment } from '@/types/library'
import { bookService } from '@/services/bookService'
import { borrowingService } from '@/services/borrowingService'
import { ratingService } from '@/services/ratingService'
import { i18n } from '@/i18n'
import { useAuthStore } from './auth'

interface LibraryState {
  books: Book[]
  booksLoading: boolean
  booksError: string
  borrowings: BorrowingRecord[]
  borrowingsLoading: boolean
  borrowingsError: string
  ratings: Rating[]
  comments: Comment[]
  ratingsLoading: boolean
  commentsLoading: boolean
  ratingError: string
  commentError: string
}

export const useLibraryStore = defineStore('library', {
  state: (): LibraryState => ({
    books: [],
    booksLoading: false,
    booksError: '',
    borrowings: [],
    borrowingsLoading: false,
    borrowingsError: '',
    ratings: [],
    comments: [],
    ratingsLoading: false,
    commentsLoading: false,
    ratingError: '',
    commentError: '',
  }),
  getters: {
    activeBorrowings: (state): BorrowingRecord[] =>
      state.borrowings.filter((record) => record.status === 'active'),
    borrowingHistory: (state): BorrowingRecord[] =>
      state.borrowings.filter((record) => record.status !== 'active'),
    getBookById: (state) => {
      return (id: string) => state.books.find((book) => book.id === id)
    },
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
          tagsEn: book.tagsEn ?? [],
        }))
      } catch (err) {
        this.booksError = err instanceof Error ? err.message : '无法加载图书数据'
      } finally {
        this.booksLoading = false
      }
    },
    async fetchBookById(id: string) {
      const existing = this.getBookById(id)
      if (existing) return existing

      this.booksLoading = true
      this.booksError = ''
      try {
        const book = await bookService.fetchBookById(id)
        const normalized = { ...book, tags: book.tags ?? [], tagsEn: book.tagsEn ?? [] }
        const index = this.books.findIndex((item) => item.id === book.id)
        if (index >= 0) {
          this.books.splice(index, 1, normalized)
        } else {
          this.books.push(normalized)
        }
        return normalized
      } catch (err) {
        this.booksError = err instanceof Error ? err.message : '无法获取图书信息'
        return null
      } finally {
        this.booksLoading = false
      }
    },
    async createBook(payload: Omit<Book, 'id' | 'availableCopies'> & { availableCopies?: number }) {
      this.booksError = ''
      try {
        // 确保availableCopies有默认值
        const bookPayload = {
          ...payload,
          availableCopies: payload.availableCopies ?? 1
        }
        const book = await bookService.createBook(bookPayload)
        this.books.push({ ...book, tags: book.tags ?? [], tagsEn: book.tagsEn ?? [] })
        return { success: true, message: '书籍已创建。' }
      } catch (err) {
        const message = err instanceof Error ? err.message : '创建书籍失败'
        this.booksError = message
        return { success: false, message }
      }
    },
    async updateBook(id: string, payload: Omit<Book, 'id' | 'availableCopies'> & { availableCopies?: number }) {
      this.booksError = ''
      try {
        const book = await bookService.updateBook(id, payload)
        const normalized = { ...book, tags: book.tags ?? [], tagsEn: book.tagsEn ?? [] }
        const index = this.books.findIndex((item) => item.id === id)
        if (index >= 0) {
          this.books.splice(index, 1, normalized)
        } else {
          this.books.push(normalized)
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
    async importBooks(file: File): Promise<{ success: boolean; message: string; result?: BookImportResult }> {
      this.booksError = ''
      try {
        const result = await bookService.importBooks(file)
        await this.fetchBooks(true)
        return {
          success: true,
          message: `已导入 ${result.imported} 条记录，失败 ${result.failed} 条。`,
          result,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '批量导入失败'
        this.booksError = message
        return { success: false, message }
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

      const targetBook = this.getBookById(bookId)
      if (targetBook && targetBook.status !== 'available') {
        return { success: false, message: '该图书暂不可借阅。' }
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
        return { success: true, message: i18n.global.t('borrowings.messages.borrowSuccess') }
      } catch (err) {
        const message = err instanceof Error ? err.message : '借阅失败，请稍后再试。'
        return { success: false, message }
      }
    },
    async renewBorrowing(recordId: string) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, message: '请先登录后再续借图书。' }
      }

      try {
        await borrowingService.renewBorrowing(recordId)
        await Promise.all([this.fetchBorrowings(true), this.fetchBooks(true)])
        return { success: true, message: i18n.global.t('borrowings.messages.renewSuccess') }
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : '续借失败，请稍后再试。',
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
        return { success: true, message: i18n.global.t('borrowings.messages.returnSuccess') }
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : '归还失败，请稍后再试。',
        }
      }
    },
    // 评分相关操作
    async fetchBookRatings(bookId: string) {
      this.ratingsLoading = true
      this.ratingError = ''
      try {
        const result = await ratingService.getBookRatings(bookId)
        const ratings = result?.ratings || []
        const averageRating = result?.averageRating || 0
        const ratingCount = result?.ratingCount || 0

        this.ratings = ratings

        // 更新书籍的评分信息
        const bookIndex = this.books.findIndex(book => book.id === bookId)
        if (bookIndex >= 0 && this.books[bookIndex]) {
          const updatedBook = {
            ...this.books[bookIndex],
            averageRating,
            ratingCount
          }
          // 避免直接修改数组元素
          const updatedBooks = [...this.books]
          updatedBooks[bookIndex] = updatedBook
          this.books = updatedBooks
        }

        return { ratings, averageRating, ratingCount }
      } catch (err) {
        this.ratingError = err instanceof Error ? err.message : '无法加载评分数据'
        console.error('加载评分失败:', err)
        return { ratings: [], averageRating: 0, ratingCount: 0 }
      } finally {
        this.ratingsLoading = false
      }
    },

    async submitRating(bookId: string, rating: number) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, message: '请先登录后再评分。' }
      }

      this.ratingError = ''
      try {
        const newRating = await ratingService.submitRating(bookId, rating)

        // 更新本地评分数据
        const existingIndex = this.ratings.findIndex(
          r => r.bookId === bookId && r.userId === authStore.user!.id
        )

        if (existingIndex >= 0) {
          this.ratings[existingIndex] = newRating
        } else {
          this.ratings.push(newRating)
        }

        // 重新获取并更新书籍评分信息
        await this.fetchBookRatings(bookId)

        return { success: true, message: '评分成功！' }
      } catch (err) {
        const message = err instanceof Error ? err.message : '评分失败'
        this.ratingError = message
        console.error('提交评分失败:', err)
        return { success: false, message }
      }
    },

    async getUserBookRating(bookId: string) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return null
      }

      try {
        const rating = await ratingService.getUserBookRating(bookId, authStore.user.id)
        return rating
      } catch (err) {
        console.error('获取用户评分失败:', err)
        return null
      }
    },

    // 评论相关操作
    async fetchBookComments(bookId: string) {
      this.commentsLoading = true
      this.commentError = ''
      try {
        const comments = await ratingService.getBookComments(bookId)
        // 只更新指定书籍的评论
        this.comments = this.comments.filter(c => c.bookId !== bookId).concat(comments)
        return comments
      } catch (err) {
        this.commentError = err instanceof Error ? err.message : '无法加载评论数据'
        console.error('加载评论失败:', err)
        return []
      } finally {
        this.commentsLoading = false
      }
    },

    async submitComment(bookId: string, content: string) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, message: '请先登录后再发表评论。' }
      }

      this.commentError = ''
      try {
        const newComment = await ratingService.submitComment(bookId, content)

        // 更新本地评论数据
        this.comments.unshift(newComment)

        return { success: true, message: '评论发表成功！', comment: newComment }
      } catch (err) {
        const message = err instanceof Error ? err.message : '评论失败'
        this.commentError = message
        console.error('提交评论失败:', err)
        return { success: false, message }
      }
    },

    async deleteComment(commentId: string) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, message: '请先登录后再删除评论。' }
      }

      try {
        await ratingService.deleteComment(commentId)

        // 从本地数据中删除评论
        this.comments = this.comments.filter(comment => comment.id !== commentId)

        return { success: true, message: '评论已删除。' }
      } catch (err) {
        const message = err instanceof Error ? err.message : '删除评论失败'
        console.error('删除评论失败:', err)
        return { success: false, message }
      }
    },

    // 获取书籍的评论列表
    getBookComments(bookId: string): Comment[] {
      return this.comments.filter(comment => comment.bookId === bookId)
    }
  },
})
