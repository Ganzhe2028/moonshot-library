import type { Book } from '@/types/library'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

class BookService {
  private getHeaders(includeAuth = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (includeAuth) {
      const token = localStorage.getItem('token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    return headers
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, init)

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '请求图书数据失败')
    }

    return data.data as T
  }

  async fetchBooks(): Promise<Book[]> {
    const data = await this.request<{ books: Book[] }>('/books', {
      headers: this.getHeaders(),
    })
    return data.books ?? []
  }

  async fetchBookById(id: string): Promise<Book> {
    const data = await this.request<{ book: Book }>(`/books/${id}`, {
      headers: this.getHeaders(),
    })
    return data.book
  }

  async createBook(payload: Omit<Book, 'id' | 'availableCopies'> & { availableCopies?: number }): Promise<Book> {
    const data = await this.request<{ book: Book }>(`/books`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    })
    return data.book
  }

  async updateBook(id: string, payload: Partial<Book>): Promise<Book> {
    const data = await this.request<{ book: Book }>(`/books/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    })
    return data.book
  }

  async deleteBook(id: string): Promise<void> {
    await this.request<void>(`/books/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    })
  }
}

export const bookService = new BookService()
