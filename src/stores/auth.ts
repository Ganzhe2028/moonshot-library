import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser } from '@/types/library'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isLibrarian = computed(() => user.value?.role === 'librarian')
  const isTeacher = computed(() => user.value?.role === 'teacher')
  const isStudent = computed(() => user.value?.role === 'student')

  // 方法
  async function login(email: string, password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.login({ email, password })
      user.value = response.data.user
      localStorage.setItem('auth_user', JSON.stringify(response.data.user))
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

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

  async function logout(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      await authService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      localStorage.removeItem('auth_user')
      isLoading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  // 初始化时检查是否已有token
  function initializeAuth(): void {
    const token = authService.getToken()
    if (token) {
      const savedUser = localStorage.getItem('auth_user')
      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser)
        } catch {
          authService.clearTokens()
          localStorage.removeItem('auth_user')
        }
      }
    }
  }

  // 初始化
  initializeAuth()

  return {
    // 状态
    user,
    isLoading,
    error,
    
    // 计算属性
    isAuthenticated,
    userRole,
    isAdmin,
    isLibrarian,
    isTeacher,
    isStudent,
    
    // 方法
    login,
    register,
    logout,
    clearError,
  }
})