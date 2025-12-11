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
  averageRating?: number
  ratingCount?: number
  word_count?: number // 书籍字数
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

export interface Favorite {
  id: string
  userId: string
  bookId: string
  createdAt?: string
  updatedAt?: string
}

export interface Credit {
  id: string
  userId: string
  score: number
  level: 'excellent' | 'good' | 'warn' | 'suspended'
  status: 'active' | 'restricted' | 'suspended'
  remarks?: string
  createdAt?: string
  updatedAt?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  author: string
}

export interface Rating {
  id: string
  bookId: string
  userId: string
  rating: number // 1-5
  createdAt?: string
  updatedAt?: string
}

export interface Comment {
  id: string
  bookId: string
  userId: string
  userName: string
  content: string
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
  total_words_read?: number // 总阅读字数
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
