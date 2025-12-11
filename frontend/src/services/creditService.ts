import type { Credit } from '@/types/library'

const API_BASE_URL = '/api'

class CreditService {
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
      const message = result?.message || '信用接口请求失败'
      throw new Error(message)
    }
    return (result.success && result.data ? result.data : result) as T
  }

  async fetchCredit(userId: string): Promise<Credit> {
    const data = await this.request<{ credit: Credit }>(`${API_BASE_URL}/users/${userId}/credit`, {
      headers: this.getHeaders(),
    })
    return data.credit
  }

  async updateCredit(
    userId: string,
    payload: Partial<Pick<Credit, 'score' | 'remarks'>>,
  ): Promise<Credit> {
    const data = await this.request<{ credit: Credit }>(`${API_BASE_URL}/users/${userId}/credit`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    })
    return data.credit
  }
}

export const creditService = new CreditService()
