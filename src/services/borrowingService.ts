import type { BorrowingRecord } from '@/types/library'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

class BorrowingService {
  private getHeaders(): Record<string, string> {
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private async request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init)
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = result?.message || '借阅接口请求失败'
      throw new Error(message)
    }

    return (result.success && result.data) ? result.data as T : result as unknown as T
  }

  async fetchBorrowings(params: { userId?: string; status?: string } = {}): Promise<BorrowingRecord[]> {
    const searchParams = new URLSearchParams()
    if (params.userId) searchParams.append('userId', params.userId)
    if (params.status) searchParams.append('status', params.status)

    const query = searchParams.toString()
    const url = `${API_BASE_URL}/borrowings${query ? `?${query}` : ''}`

    const data = await this.request<{ borrowings: BorrowingRecord[] }>(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return data.borrowings ?? []
  }

  async borrowBook(bookId: string): Promise<BorrowingRecord> {
    const data = await this.request<{ borrowing: BorrowingRecord }>(
      `${API_BASE_URL}/borrowings`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ bookId }),
      },
    )

    return data.borrowing
  }

  async returnBook(borrowingId: string): Promise<BorrowingRecord> {
    const data = await this.request<{ borrowing: BorrowingRecord }>(
      `${API_BASE_URL}/borrowings/${borrowingId}/return`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
      },
    )

    // 获取借阅记录信息
    const borrowing = data.borrowing;
    if (borrowing && borrowing.bookId) {
      try {
        // 获取书籍信息以获取字数
        const bookResponse = await this.request<{ book: { wordCount: number } }>(
          `${API_BASE_URL}/books/${borrowing.bookId}`,
          {
            method: 'GET',
            headers: this.getHeaders(),
          }
        );
        const bookWordCount = bookResponse.book?.wordCount || 0;

        // 更新用户总阅读字数
        this.updateUserTotalWordsRead(bookWordCount);
      } catch (error) {
        console.error('更新用户阅读字数失败:', error);
        // 不影响主流程，继续返回借阅记录
      }
    }

    return data.borrowing
  }

  // 辅助方法：更新用户总阅读字数
  private updateUserTotalWordsRead(wordCount: number): void {
    try {
      // 从localStorage获取当前用户信息
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        const user = JSON.parse(userJson);
        // 更新总阅读字数
        user.total_words_read = (user.total_words_read || 0) + wordCount;
        // 保存更新后的用户信息
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
    } catch (error) {
      console.error('更新用户总阅读字数失败:', error);
    }
  }

  async renewBorrowing(borrowingId: string): Promise<BorrowingRecord> {
    const data = await this.request<{ borrowing: BorrowingRecord }>(
      `${API_BASE_URL}/borrowings/${borrowingId}/renew`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
      },
    )

    return data.borrowing
  }
}

export const borrowingService = new BorrowingService()
