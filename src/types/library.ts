export type BookStatus = 'available' | 'borrowed' | 'reserved' | 'maintenance'

export interface Book {
  id: string
  title: string
  titleEn?: string
  authors: string[]
  authorsEn?: string[]
  isbn?: string
  publisher?: string
  publisherEn?: string
  publishedYear?: number
  category: string
  categoryEn?: string
  location?: string
  status: BookStatus
  description?: string
  descriptionEn?: string
  coverImage?: string
  totalCopies: number
  availableCopies: number
  tags: string[]
  tagsEn?: string[]
}

export interface BookImportError {
  row: number
  message: string
}

export interface BookImportResult {
  imported: number
  failed: number
  total: number
  errors: BookImportError[]
  books: Book[]
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
