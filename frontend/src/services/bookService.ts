import type { Book, BookImportResult } from '@/types/library'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

class BookService {
  private getHeaders(includeJson = true): Record<string, string> {
    const headers: Record<string, string> = {}
    if (includeJson) {
      headers['Content-Type'] = 'application/json'
    }
    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, init)
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data?.message || '请求图书数据失败'
      throw new Error(message)
    }

    return data.data as T
  }

  async fetchBooks(params?: { limit?: number; offset?: number; category?: string; search?: string }): Promise<Book[]> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.category) searchParams.append('category', params.category)
    if (params?.search) searchParams.append('search', params.search)

    const query = searchParams.toString()

    const data = await this.request<{ books: Book[] }>(`/books${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: this.getHeaders(false),
    })

    return data.books ?? []
  }

  async fetchBookById(id: string): Promise<Book> {
    const data = await this.request<{ book: Book }>(`/books/${id}`, {
      method: 'GET',
      headers: this.getHeaders(false),
    })
    return data.book
  }

  async createBook(payload: Omit<Book, 'id' | 'availableCopies'> & { availableCopies?: number }): Promise<Book> {
    const data = await this.request<{ book: Book }>('/books', {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    })
    return data.book
  }

  async updateBook(
    id: string,
    payload: Omit<Book, 'id' | 'availableCopies'> & { availableCopies?: number },
  ): Promise<Book> {
    const data = await this.request<{ book: Book }>(`/books/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    })
    return data.book
  }

  async deleteBook(id: string): Promise<void> {
    await this.request<null>(`/books/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(false),
    })
  }

  async importBooks(file: File): Promise<BookImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    const data = await this.request<BookImportResult>('/books/import', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: formData,
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
