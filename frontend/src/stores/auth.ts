import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser } from '@/types/library'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const loginMethod = ref<'local' | 'm365' | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role || '')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isLibrarian = computed(() => user.value?.role === 'librarian')
  const isTeacher = computed(() => user.value?.role === 'teacher')
  const isStudent = computed(() => user.value?.role === 'student')

  // 初始化认证状态
  async function initializeAuth(): Promise<void> {
    try {
      // 从localStorage读取用户信息
      const savedUser = localStorage.getItem('auth_user')
      if (savedUser) {
        user.value = JSON.parse(savedUser)
        const loginMethodFromStorage = localStorage.getItem('login_method')
        loginMethod.value = loginMethodFromStorage as 'local' | 'm365' | null
      }
    } catch (err) {
      console.error('初始化认证失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 登录方法
  async function login(email: string, password: string, redirectUrl?: string): Promise<{success: boolean, redirectUrl?: string}> {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.login({ email, password }, redirectUrl)
      user.value = response.data.user
      loginMethod.value = 'local'
      localStorage.setItem('auth_user', JSON.stringify(response.data.user))
      return { success: true, redirectUrl: undefined } // login方法不返回redirectUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }
  
  // M365登录方法
  async function loginWithM365(redirectUrl?: string): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      loginMethod.value = 'm365'
      await authService.loginWithM365(redirectUrl)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'M365登录失败'
      loginMethod.value = null
    } finally {
      isLoading.value = false
    }
  }

  // 处理M365重定向登录
  async function handleM365Redirect(): Promise<{success: boolean, redirectUrl?: string}> {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await authService.handleM365Redirect()
      if (result && result.user) {
        // 将object类型安全地转换为AuthUser接口
        const userData = result.user ? (result.user as unknown as AuthUser) : null
        user.value = userData
        loginMethod.value = 'm365'
        localStorage.setItem('auth_user', JSON.stringify(result.user))
        localStorage.setItem('login_method', 'm365')
        return { success: true, redirectUrl: result.redirectUrl }
      }
      return { success: false }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '处理M365登录失败'
      loginMethod.value = null
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  // 注册方法
  async function register(userData: {
    email: string
    password: string
    name: string
    role: 'student' | 'teacher' | 'librarian'
    grade?: string
  }): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.register(userData)
      user.value = response.data.user
      localStorage.setItem('auth_user', JSON.stringify(response.data.user))
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '注册失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 登出方法
  async function logout(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      await authService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      loginMethod.value = null
      localStorage.removeItem('auth_user')
      localStorage.removeItem('login_method')
      isLoading.value = false
    }
  }

  // 清除错误
  function clearError(): void {
    error.value = null
  }

  return {
    user,
    isLoading,
    error,
    loginMethod,
    isAuthenticated,
    userRole,
    isAdmin,
    isLibrarian,
    isTeacher,
    isStudent,
    initializeAuth,
    login,
    loginWithM365,
    handleM365Redirect,
    register,
    logout,
    clearError
  }
})