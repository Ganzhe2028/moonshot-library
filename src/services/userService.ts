import type { AuthUser } from '@/types/library'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

class UserService {
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

  async fetchUsers(params: { limit?: number; offset?: number } = {}): Promise<AuthUser[]> {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.append('limit', String(params.limit))
    if (params.offset) searchParams.append('offset', String(params.offset))
    const query = searchParams.toString()

    const response = await fetch(`${API_BASE_URL}/users${query ? `?${query}` : ''}`, {
      headers: this.getHeaders(),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '获取用户列表失败')
    }

    return data.data?.users ?? []
  }

  async fetchUserById(id: string): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: this.getHeaders(),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '获取用户信息失败')
    }

    return data.data?.user
  }

  async updateUser(
    id: string,
    payload: Partial<Pick<AuthUser, 'name' | 'grade' | 'avatarColor' | 'membership'>>,
  ): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '更新用户信息失败')
    }

    return data.data?.user
  }
}

export const userService = new UserService()
