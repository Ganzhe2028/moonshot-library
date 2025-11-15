import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types/library'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

class AuthService {
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

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || '邮箱或密码错误')
        } else if (response.status === 400) {
          throw new Error(data.message || '请求参数错误')
        } else {
          throw new Error(data.message || `登录失败: ${response.statusText}`)
        }
      }
      
      // 保存token到localStorage
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('refreshToken', data.data.refreshToken)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('网络错误，请检查网络连接')
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        // 处理具体的错误信息
        if (response.status === 409) {
          throw new Error(data.message || '该邮箱已被注册')
        } else if (response.status === 400) {
          throw new Error(data.message || '注册信息填写有误')
        } else {
          throw new Error(data.message || `注册失败: ${response.statusText}`)
        }
      }
      
      // 保存token到localStorage
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('refreshToken', data.data.refreshToken)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('网络错误，请检查网络连接')
    }
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 无论服务器响应如何，都清除本地token
      this.clearTokens()
    }
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token)
        if (data.data?.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken)
        }
        return data.data.token
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      this.clearTokens()
    }

    return null
  }

  clearTokens(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  getToken(): string | null {
    return localStorage.getItem('token')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export const authService = new AuthService()