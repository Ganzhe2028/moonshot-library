export type BookStatus = 'available' | 'borrowed' | 'reserved'

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  location: string
  status: BookStatus
  summary: string
  cover: string
  tags: string[]
}

export interface BorrowingRecord {
  id: string
  bookId: string
  borrowDate: string
  dueDate: string
  returnDate?: string
  status: 'active' | 'returned' | 'overdue'
  renewals: number
}

export interface UserProfile {
  id: string
  name: string
  email: string
  grade: string
  avatarColor: string
  membership: string
}
