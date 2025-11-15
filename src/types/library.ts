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
