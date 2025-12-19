const API_BASE_URL = '/api'

class SettingsService {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  private async request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init)
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = result?.message || '系统设置请求失败'
      throw new Error(message)
    }

    return result.success && result.data ? (result.data as T) : (result as unknown as T)
  }

  async fetchBorrowingLimit(): Promise<number> {
    const data = await this.request<{ maxActiveBorrowings: number }>(
      `${API_BASE_URL}/settings/borrowing-limit`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      },
    )

    return data.maxActiveBorrowings
  }

  async updateBorrowingLimit(limit: number): Promise<number> {
    const data = await this.request<{ maxActiveBorrowings: number }>(
      `${API_BASE_URL}/settings/borrowing-limit`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ maxActiveBorrowings: limit }),
      },
    )

    return data.maxActiveBorrowings
  }
}

export const settingsService = new SettingsService()
