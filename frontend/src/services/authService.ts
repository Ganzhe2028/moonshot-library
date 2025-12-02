import type { LoginRequest, RegisterRequest, AuthResponse, AuthUser } from '@/types/library'
import msalService from './msalService'

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

  // 设置登录方式
  setLoginMethod(method: 'local' | 'm365'): void {
    localStorage.setItem('loginMethod', method);
  }

  // 获取登录方式
  getLoginMethod(): 'local' | 'm365' | null {
    return localStorage.getItem('loginMethod') as 'local' | 'm365' | null;
  }

  // 保存用户会话信息
  saveUserSession(user: object, token: string, refreshToken: string, loginMethod: 'local' | 'm365'): void {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('loginMethod', loginMethod);
  }

  // 获取用户会话信息
  getUserSession(): { user: object; token: string; refreshToken: string } | null {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userJson = localStorage.getItem('user');

    if (!token || !refreshToken || !userJson) {
      return null;
    }

    try {
      const user = JSON.parse(userJson);
      return { user, token, refreshToken };
    } catch (error) {
      console.error('Error parsing user session:', error);
      return null;
    }
  }

  // 检查会话是否有效
  isSessionValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // 简单检查token是否过期
      const parts = token.split('.');
      if (parts.length < 2 || !parts[1]) return false;
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp > Date.now() / 1000;
    } catch (error) {
        console.error('Error validating token:', error);
        return false;
      }
  }

  async login(credentials: LoginRequest, redirectUrl?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials),
      })

      // 检查响应是否为JSON格式
      const contentType = response.headers.get('content-type')
      let data

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // 如果不是JSON响应，可能是HTML错误页面
        await response.text() // 消费响应体
        throw new Error(`服务器返回非JSON响应: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || '邮箱或密码错误')
        } else if (response.status === 400) {
          throw new Error(data.message || '请求参数错误')
        } else {
          throw new Error(data.message || `登录失败: ${response.statusText}`)
        }
      }

      // 使用统一的会话保存方法
      if (data.data?.token && data.data?.user) {
        this.saveUserSession(
          data.data.user,
          data.data.token,
          data.data.refreshToken || '',
          'local'
        )
      }

      // 如果有重定向URL，添加到返回数据中
      if (redirectUrl) {
        data.data.redirectUrl = redirectUrl
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

      // 检查响应是否为JSON格式
      const contentType = response.headers.get('content-type')
      let data

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // 如果不是JSON响应，可能是HTML错误页面
        await response.text() // 消费响应体
        throw new Error(`服务器返回非JSON响应: ${response.status} ${response.statusText}`)
      }

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

      // 使用统一的会话保存方法
      if (data.data?.token && data.data?.user) {
        this.saveUserSession(
          data.data.user,
          data.data.token,
          data.data.refreshToken || '',
          'local'
        )
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
    const loginMethod = this.getLoginMethod()

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
      // 无论服务器响应如何，都清除本地token和会话数据
      this.clearSession();

      // 如果是M365登录，执行额外的Microsoft注销步骤
      if (loginMethod === 'm365') {
        try {
          // 使用msalService提供的正确注销方法
          console.log('M365 logout not implemented in msalService');
        } catch (msalError) {
          console.error('MSAL logout error:', msalError);
          // 继续执行，即使MSAL注销失败
        }
      }
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

      // 检查响应是否为JSON格式
      const contentType = response.headers.get('content-type')
      let data

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // 如果不是JSON响应，可能是HTML错误页面
        await response.text() // 消费响应体
        throw new Error(`服务器返回非JSON响应: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      if (data.data?.token) {
        // 获取当前用户会话信息
        const currentSession = this.getUserSession()

        // 保存新的令牌，保持现有用户信息
        localStorage.setItem('token', data.data.token)
        if (data.data?.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken)
        }

        // 如果有用户信息，确保它仍然被保存
        if (currentSession?.user) {
          localStorage.setItem('user', JSON.stringify(currentSession.user))
        }

        return data.data.token
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      this.clearTokens()
    }

    return null
  }

  // 清除所有token和会话数据
  clearTokens(): void {
    this.clearSession();
  }

  // 清除完整会话
  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('loginMethod');
    localStorage.removeItem('user');
    localStorage.removeItem('m365LoginStarted');
  }

  // M365 SSO登录
  async loginWithM365(redirectUrl?: string): Promise<AuthResponse> {
    try {
      // 保存登录开始状态和重定向URL
      this.setLoginMethod('m365');
      localStorage.setItem('m365LoginStarted', 'true');
      if (redirectUrl) {
        localStorage.setItem('postLoginRedirect', redirectUrl);
      }

      // 使用MSAL服务进行M365登录并获取后端认证
      const msalResponse = await msalService.msalLoginFlow()

      if (!msalResponse.success) {
        throw new Error(msalResponse.message || 'M365登录失败')
      }

      // 使用统一的会话保存方法
      if (msalResponse.data?.token && msalResponse.data?.user) {
        this.saveUserSession(
          msalResponse.data.user,
          msalResponse.data.token,
          msalResponse.data.refreshToken || '',
          'm365'
        )
      }

      // 确保返回值符合AuthResponse类型
      const responseData = msalResponse.data || {};
      return {
        success: msalResponse.success,
        message: msalResponse.message || '登录成功',
        data: {
          user: responseData.user as unknown as AuthUser,
          token: responseData.token || '',
          refreshToken: responseData.refreshToken || ''
        }
      }
    } catch (error) {
      // 登录失败时清除会话
      this.clearSession()
      if (error instanceof Error) {
        throw error
      }
      throw new Error('M365登录失败')
    }
  }

  // 获取Microsoft登录URL（重定向模式）
  async getM365LoginUrl(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/msal/login`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '获取登录URL失败')
      }

      return data.data.authUrl
    } catch (error) {
      console.error('获取M365登录URL失败:', error)
      throw error
    }
  }

  // 处理M365重定向登录
  async handleM365Redirect(): Promise<{ user: object; redirectUrl?: string } | false> {
    try {
      const account = await msalService.handleRedirectCallback()
      if (!account) {
        return false;
      }

      const token = await msalService.getToken()
      if (!token) {
        return false;
      }

      const response = await msalService.verifyWithBackend(token)
      if (response.success && response.data?.token) {
        // 保存完整的用户会话
        this.saveUserSession(
          response.data.user || {},
          response.data.token,
          response.data.refreshToken || '',
          'm365'
        )

        // 获取并清除重定向URL
        const redirectUrl = localStorage.getItem('postLoginRedirect') || undefined;
        localStorage.removeItem('m365LoginStarted');
        localStorage.removeItem('postLoginRedirect');

        return { user: response.data.user || {}, redirectUrl };
      }

      throw new Error('M365登录验证失败');
    } catch (error) {
      console.error('处理M365重定向失败:', error)
      // 清除可能的部分会话数据
      this.clearSession();
      return false
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 获取M365令牌（用于M365 API调用）
  async getM365Token(): Promise<string | null> {
    try {
      const loginMethod = this.getLoginMethod()
      if (loginMethod === 'm365') {
        const token = await msalService.getToken()
        return token
      }
      return null
    } catch (error) {
      console.error('获取M365令牌失败:', error)
      return null
    }
  }

  isAuthenticated(): boolean {
    // 增强的认证检查：检查令牌是否存在并有效
    const token = this.getToken();
    return !!token && this.isSessionValid();
  }
}

export const authService = new AuthService()
