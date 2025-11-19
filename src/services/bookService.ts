import type { Book } from '@/types/library'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

class BookService {
  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '请求图书数据失败')
    }

    return data.data as T
  }

  async fetchBooks(): Promise<Book[]> {
    const data = await this.request<{ books: Book[] }>('/books')
    return data.books ?? []
  }

  async fetchBookById(id: string): Promise<Book> {
    const data = await this.request<{ book: Book }>(`/books/${id}`)
    return data.book
  }
}

export const bookService = new BookService()
