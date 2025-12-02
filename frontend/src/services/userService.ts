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

  private async request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init)
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = result?.message || '用户接口请求失败'
      throw new Error(message)
    }

    return (result.success && result.data) ? result.data as T : result as unknown as T
  }

  async fetchUsers(params: { limit?: number; offset?: number } = {}): Promise<AuthUser[]> {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.append('limit', String(params.limit))
    if (params.offset) searchParams.append('offset', String(params.offset))
    const query = searchParams.toString()

    const data = await this.request<{ users: AuthUser[] }>(`${API_BASE_URL}/users${query ? `?${query}` : ''}`, {
      headers: this.getHeaders(),
    })

    return data.users ?? []
  }

  async getAllUsers(): Promise<AuthUser[]> {
    const data = await this.request<{ users: AuthUser[] }>(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return data.users || []
  }

  async fetchUserById(id: string): Promise<AuthUser> {
    const data = await this.request<{ user: AuthUser }>(`${API_BASE_URL}/users/${id}`, {
      headers: this.getHeaders(),
    })

    return data.user
  }

  async getUserById(id: string): Promise<AuthUser> {
    const data = await this.request<{ user: AuthUser }>(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return data.user
  }

  async updateUser(
    id: string,
    payload: Partial<Pick<AuthUser, 'name' | 'grade' | 'avatarColor' | 'membership' | 'role'>>,
  ): Promise<AuthUser> {
    const data = await this.request<{ user: AuthUser }>(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    })

    return data.user
  }

  async getUsersByRole(role: string): Promise<AuthUser[]> {
    const data = await this.request<{ users: AuthUser[] }>(`${API_BASE_URL}/users/role/${role}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return data.users || []
  }
}

export const userService = new UserService()
