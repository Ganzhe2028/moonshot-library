import type { Book, BookImportResult } from '@/types/library'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

class BookService {
  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  private async request<T>(path: string, init?: RequestInit): Promise<T> {

    const response = await fetch(`${API_BASE_URL}${path}`, init)

    const data = await response.json()


    if (!response.ok) {
      throw new Error(data.message || '请求图书数据失败')
    }
    const data = await this.request<{ books: Book[] }>('/books')
  async fetchBooks(): Promise<Book[]> {
    const data = await this.request<{ books: Book[] }>('/books', {
      headers: this.getHeaders(),
    })
    const data = await this.request<{ book: Book }>(`/books/${id}`)
      method: 'DELETE',

    const data = await this.request<BookImportResult>('/books/import', {
      method: 'POST',
      headers: this.getHeaders(true, null),
      body: formData,
    })
    return data
  }
}

export const bookService = new BookService()
