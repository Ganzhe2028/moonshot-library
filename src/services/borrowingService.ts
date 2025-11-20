import type { BorrowingRecord } from '@/types/library'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

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
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data?.message || '借阅接口请求失败'
      throw new Error(message)
    }

    return data.data as T
  }

  async fetchBorrowings(params: { userId?: string; status?: string } = {}): Promise<BorrowingRecord[]> {
    const searchParams = new URLSearchParams()
    if (params.userId) searchParams.append('userId', params.userId)
    if (params.status) searchParams.append('status', params.status)

    const query = searchParams.toString()
    const url = `${API_BASE_URL}/borrowings${query ? `?${query}` : ''}`

    const data = await this.request<{ records: BorrowingRecord[] }>(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return data.records ?? []
  }

  async borrowBook(bookId: string): Promise<BorrowingRecord> {
    const data = await this.request<{ borrowingRecord: BorrowingRecord }>(
      `${API_BASE_URL}/borrowings`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ bookId }),
      },
    )

    return data.borrowingRecord
  }

  async returnBook(borrowingId: string): Promise<BorrowingRecord> {
    const data = await this.request<{ borrowingRecord: BorrowingRecord }>(
      `${API_BASE_URL}/borrowings/${borrowingId}/return`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
      },
    )

    return data.borrowingRecord
  }

  async renewBorrowing(borrowingId: string): Promise<BorrowingRecord> {
    const data = await this.request<{ borrowingRecord: BorrowingRecord }>(
      `${API_BASE_URL}/borrowings/${borrowingId}/renew`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
      },
    )

    return data.borrowingRecord
  }
}

export const borrowingService = new BorrowingService()
