import type { Book, BookImportResult } from '@/types/library'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

class BookService {
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }

    const headers = init?.headers ? {
      ...defaultHeaders,
      ...init.headers
    } : defaultHeaders

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers
    })

    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = result?.message || '请求图书数据失败'
      throw new Error(message)
    }

    return (result.success && result.data) ? result.data as T : result as unknown as T
  }

  private getHeaders(isMultipart = false, token?: string | null): Record<string, string> {
    const headers: Record<string, string> = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (!isMultipart) {
      headers['Content-Type'] = 'application/json'
    }

    return headers
  }

  async fetchBooks(params?: { limit?: number; offset?: number; category?: string; search?: string }): Promise<Book[]> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.category) searchParams.append('category', params.category)
    if (params?.search) searchParams.append('search', params.search)

    const query = searchParams.toString()

    const data = await this.request<{ books: Book[] }>(`/books${query ? `?${query}` : ''}`, {
      headers: this.getHeaders(),
    })

    return data.books || []
  }

  async fetchBookById(id: string): Promise<Book> {
    const data = await this.request<{ book: Book }>(`/books/${id}`, {
      headers: this.getHeaders(),
    })

    return data.book
  }

  async createBook(payload: Omit<Book, 'id'>): Promise<Book> {
    const data = await this.request<{ book: Book }>('/books', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return data.book
  }

  async updateBook(id: string, payload: Partial<Book>): Promise<Book> {
    const data = await this.request<{ book: Book }>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return data.book
  }

  async deleteBook(id: string): Promise<void> {
    await this.request(`/books/${id}`, {
      method: 'DELETE'
    })
  }

  async importBooks(file: File): Promise<BookImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    const data = await this.request<BookImportResult>('/books/import', {
      method: 'POST',
      headers: {}, // 不设置Content-Type，让浏览器自动设置multipart/form-data
      body: formData
    })

    return data
  }

  async getCategories(): Promise<string[]> {
    const data = await this.request<{ categories?: string[] }>('/books/categories', {
      headers: this.getHeaders(),
    })

    return data.categories || []
  }
}

export const bookService = new BookService()
