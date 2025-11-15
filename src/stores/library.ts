import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

import { mockBooks } from '@/data/mockBooks'
import type { Book, BorrowingRecord, UserProfile } from '@/types/library'

interface LibraryState {
  books: Book[]
  user: UserProfile & {
    borrowings: BorrowingRecord[]
    history: BorrowingRecord[]
  }
}

const BORROW_PERIOD_DAYS = 21
const RENEW_PERIOD_DAYS = 14
const MAX_RENEWALS = 2

const toISODate = (date: Date) => {
  const [isoDate] = date.toISOString().split('T')
  return isoDate ?? ''
}

const todayISO = () => toISODate(new Date())
const addDays = (dateString: string, days: number) => {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export const useLibraryStore = defineStore('library', {
  state: (): LibraryState => ({
    books: mockBooks.map((book) => ({ ...book })),
    user: {
      id: 'stu-2048',
      name: 'Nova Li',
      email: 'nova.li@moonshotacademy.cn',
      grade: 'Moonshot Cohort 2025',
      avatarColor: '#8b5cf6',
      membership: 'Active Student',
      borrowings: [
        {
          id: 'txn-1001',
          bookId: 'bk-systems-thinking',
          borrowDate: '2025-01-12',
          dueDate: '2025-02-02',
          status: 'active',
          renewals: 0,
        },
      ],
      history: [
        {
          id: 'txn-0992',
          bookId: 'bk-ai-literacy',
          borrowDate: '2024-12-01',
          dueDate: '2024-12-22',
          returnDate: '2024-12-20',
          status: 'returned',
          renewals: 1,
        },
      ],
    },
  }),
  getters: {
    currentUser: (state) => {
      const authStore = useAuthStore()
      return authStore.user || state.user
    },
    getBookById: (state) => (id: string) => state.books.find((book) => book.id === id),
    activeBorrowings: (state) => {
      const currentUser = state.currentUser
      return currentUser.borrowings
    },
    borrowingHistory: (state) => {
      const currentUser = state.currentUser
      return currentUser.history
    },
    isBookBorrowedByUser: (state) => (bookId: string) => {
      const currentUser = state.currentUser
      return currentUser.borrowings.some((record) => record.bookId === bookId)
    },
  },
  actions: {
    borrowBook(bookId: string) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, message: '请先登录后再借阅图书。' }
      }

      const targetBook = this.books.find((book) => book.id === bookId)
      if (!targetBook) {
        return { success: false, message: '未找到对应的图书。' }
      }

      if (targetBook.status !== 'available') {
        return { success: false, message: '该图书暂不可借阅。' }
      }

      if (this.isBookBorrowedByUser(bookId)) {
        return { success: false, message: '你已经借阅了这本书。' }
      }

      const borrowDate = todayISO()
      const record: BorrowingRecord = {
        id: `txn-${Date.now()}`,
        bookId,
        borrowDate,
        dueDate: addDays(borrowDate, BORROW_PERIOD_DAYS),
        status: 'active',
        renewals: 0,
      }

      targetBook.status = 'borrowed'
      this.currentUser.borrowings.push(record)

      return { success: true, message: '借阅成功，祝你阅读愉快！' }
    },
    returnBook(recordId: string) {
      const recordIndex = this.currentUser.borrowings.findIndex((record) => record.id === recordId)
      if (recordIndex === -1) {
        return { success: false, message: '未找到借阅记录。' }
      }

      const record = this.currentUser.borrowings[recordIndex]!
      const book = this.books.find((item) => item.id === record.bookId)

      if (book) {
        book.status = 'available'
      }

      record.status = 'returned'
      record.returnDate = todayISO()

      this.currentUser.history.unshift(record)
      this.currentUser.borrowings.splice(recordIndex, 1)

      return { success: true, message: '已归还图书。' }
    },
    renewBorrowing(recordId: string) {
      const record = this.currentUser.borrowings.find((item) => item.id === recordId)
      if (!record) {
        return { success: false, message: '未找到借阅记录。' }
      }

      if (record.status !== 'active') {
        return { success: false, message: '该借阅状态不可续借。' }
      }

      if (record.renewals >= MAX_RENEWALS) {
        return { success: false, message: '最多可续借两次。' }
      }

      record.dueDate = addDays(record.dueDate, RENEW_PERIOD_DAYS)
      record.renewals += 1

      return { success: true, message: '续借成功，已延长 14 天。' }
    },
  },
})
