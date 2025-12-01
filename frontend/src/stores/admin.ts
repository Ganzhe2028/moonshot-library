import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { AuthUser, BorrowingRecord } from '@/types/library'
import { userService } from '@/services/userService'
import { borrowingService } from '@/services/borrowingService'

export const useAdminStore = defineStore('admin', () => {
  const users = ref<AuthUser[]>([])
  const usersLoading = ref(false)
  const usersError = ref<string | null>(null)

  const borrowings = ref<BorrowingRecord[]>([])
  const borrowingsLoading = ref(false)
  const borrowingsError = ref<string | null>(null)

  const fetchUsers = async (force = false) => {
    if (users.value.length && !force) return
    usersLoading.value = true
    usersError.value = null
    try {
      users.value = await userService.fetchUsers()
    } catch (err) {
      usersError.value = err instanceof Error ? err.message : '无法获取用户列表'
    } finally {
      usersLoading.value = false
    }
  }

  const fetchBorrowings = async (params: { userId?: string; status?: string } = {}) => {
    borrowingsLoading.value = true
    borrowingsError.value = null
    try {
      const records = await borrowingService.fetchBorrowings(params)
      borrowings.value = records
    } catch (err) {
      borrowingsError.value = err instanceof Error ? err.message : '无法获取借阅记录'
    } finally {
      borrowingsLoading.value = false
    }
  }

  return {
    users,
    usersLoading,
    usersError,
    borrowings,
    borrowingsLoading,
    borrowingsError,
    fetchUsers,
    fetchBorrowings,
  }
})
