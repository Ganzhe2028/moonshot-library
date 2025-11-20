export type BookStatus = 'available' | 'borrowed' | 'reserved' | 'maintenance'

export interface Book {
  id: string
  title: string
  authors: string[]
  isbn?: string
  publisher?: string
  publishedYear?: number
  category: string
  location?: string
  status: BookStatus
  description?: string
  coverImage?: string
  totalCopies: number
  availableCopies: number
  tags: string[]
}

export type BorrowingStatus = 'active' | 'returned' | 'overdue'

export interface BorrowingRecord {
  id: string
  userId: string
  bookId: string
  borrowDate: string
  dueDate: string
  returnDate?: string
  status: BorrowingStatus
  renewals: number
  createdAt?: string
  updatedAt?: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher' | 'librarian' | 'admin'
  grade?: string
  membership: 'active' | 'suspended'
  avatarColor: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role: 'student' | 'teacher' | 'librarian'
  grade?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: AuthUser
    token: string
    refreshToken: string
  }
}
