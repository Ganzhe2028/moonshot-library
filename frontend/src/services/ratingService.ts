import type { Rating, Comment } from '@/types/library'

const API_BASE_URL = '/api'

const RATINGS_STORAGE_KEY = 'bookRatings'

class RatingService {
  private getHeaders(includeAuth = false, contentType: string | null = 'application/json'): Record<string, string> {
    const headers: Record<string, string> = {
      ...(contentType ? { 'Content-Type': contentType } : {}),
    }
    if (includeAuth) {
      const token = localStorage.getItem('token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    return headers
  }

  private loadStoredRatings(): Rating[] {
    try {
      const stored = localStorage.getItem(RATINGS_STORAGE_KEY)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? (parsed as Rating[]) : []
    } catch (error) {
      console.error('解析评分数据失败:', error)
      return []
    }
  }

  private saveStoredRatings(ratings: Rating[]) {
    try {
      localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(Array.isArray(ratings) ? ratings : []))
    } catch (error) {
      console.error('保存评分数据失败:', error)
    }
  }

  private getCurrentUserId(): string | null {
    const candidates = ['auth_user', 'user', 'currentUser']
    for (const key of candidates) {
      const stored = localStorage.getItem(key)
      if (!stored) continue
      try {
        const parsed = JSON.parse(stored)
        const id = typeof parsed?.id === 'string' ? parsed.id : null
        if (id) return id
      } catch (error) {
        console.warn(`解析用户信息失败: ${key}`, error)
      }
    }
    return null
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, init)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '请求失败')
      }

      return data.data as T
    } catch (error) {
      console.error('API请求错误:', error)
      // 在开发环境或API未就绪时返回模拟数据
      if (import.meta.env.DEV) {
        return this.getMockResponse(path, init) as T
      }
      throw error
    }
  }

  // 模拟响应数据，用于开发环境
  private getMockResponse(path: string, init?: RequestInit) {
    const method = (init?.method ?? 'GET').toUpperCase()

    // 模拟获取书籍评分
    if (path.match(/^\/books\/[^/]+\/ratings$/) && method === 'GET') {
      const bookId = path.split('/')[2]
      const allRatings = this.loadStoredRatings()
      const ratings = allRatings.filter((r) => r.bookId === bookId)
      const ratingCount = ratings.length
      const averageRating = ratingCount
        ? ratings.reduce((sum, r) => sum + (typeof r.rating === 'number' ? r.rating : 0), 0) / ratingCount
        : 0
      return {
        ratings,
        averageRating,
        ratingCount,
      }
    }

    // 模拟提交评分
    if (path === '/ratings' && method === 'POST') {
      const bodyText = typeof init?.body === 'string' ? init.body : ''
      if (!bodyText) {
        throw new Error('缺少评分数据')
      }
      const body = JSON.parse(bodyText)
      if (!body?.bookId || typeof body.rating !== 'number') {
        throw new Error('评分参数无效')
      }
      const userId = this.getCurrentUserId() || 'anonymous'

      const allRatings = this.loadStoredRatings()
      const existingIndex = allRatings.findIndex((r) => r.bookId === body.bookId && r.userId === userId)

      const now = new Date().toISOString()
      const ratingRecord: Rating = {
        id: existingIndex >= 0 ? allRatings[existingIndex]!.id : Date.now().toString(),
        bookId: body.bookId,
        userId,
        rating: body.rating,
        createdAt: existingIndex >= 0 ? allRatings[existingIndex]!.createdAt : now,
        updatedAt: now,
      }

      if (existingIndex >= 0) {
        allRatings[existingIndex] = ratingRecord
      } else {
        allRatings.push(ratingRecord)
      }
      this.saveStoredRatings(allRatings)

      return {
        rating: {
          ...ratingRecord,
        }
      }
    }

    // 模拟获取用户对特定书籍的评分
    if (path.match(/^\/books\/[^/]+\/ratings\/user\/[^/]+$/) && method === 'GET') {
      const parts = path.split('/')
      const bookId = parts[2]
      const userId = parts[5]
      const allRatings = this.loadStoredRatings()
      const rating = allRatings.find((r) => r.bookId === bookId && r.userId === userId) ?? null
      return { rating }
    }

    // 模拟更新评分
    if (path.match(/^\/ratings\/[^/]+$/) && method === 'PUT') {
      const ratingId = path.split('/')[2]
      const bodyText = typeof init?.body === 'string' ? init.body : ''
      if (!bodyText) {
        throw new Error('缺少评分数据')
      }
      const body = JSON.parse(bodyText)
      if (typeof body?.rating !== 'number') {
        throw new Error('评分参数无效')
      }
      const allRatings = this.loadStoredRatings()
      const index = allRatings.findIndex((r) => r.id === ratingId)
      if (index < 0) {
        throw new Error('评分不存在')
      }

      const existing = allRatings[index]!
      const updated: Rating = {
        ...existing,
        rating: body.rating,
        updatedAt: new Date().toISOString(),
      }
      allRatings[index] = updated
      this.saveStoredRatings(allRatings)
      return { rating: updated }
    }

    // 模拟获取书籍评论
    if (path.match(/\/books\/[^/]+\/comments/) && method === 'GET') {
      return {
        comments: [
          {
            id: '1',
            bookId: path.split('/')[2],
            userId: 'user1',
            userName: '张三',
            content: '这本书非常精彩，强烈推荐！',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            bookId: path.split('/')[2],
            userId: 'user2',
            userName: '李四',
            content: '内容丰富，值得一读。',
            createdAt: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      }
    }

    // 模拟提交评论
    if (path.match(/\/comments/) && method === 'POST') {
      const bodyText = typeof init?.body === 'string' ? init.body : ''
      const body = bodyText ? JSON.parse(bodyText) : {}
      return {
        comment: {
          id: Date.now().toString(),
          ...body,
          userName: '当前用户',
          createdAt: new Date().toISOString()
        }
      }
    }

    // 模拟删除评论
    if (path.match(/\/comments\/[^/]+/) && method === 'DELETE') {
      // 在模拟环境中，删除评论总是成功
      return { success: true }
    }

    // 模拟获取所有书本评论（管理用）
    if (path === '/comments/all' && method === 'GET') {
      return {
        comments: [
          {
            id: '1',
            bookId: 'book1',
            bookTitle: 'JavaScript 高级程序设计',
            userId: 'user1',
            userName: '张三',
            content: '这本书非常精彩，强烈推荐！',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            bookId: 'book2',
            bookTitle: 'Vue.js 设计与实现',
            userId: 'user2',
            userName: '李四',
            content: '内容丰富，值得一读。',
            createdAt: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: '3',
            bookId: 'book1',
            bookTitle: 'JavaScript 高级程序设计',
            userId: 'user3',
            userName: '王五',
            content: '作者讲解得很详细，适合深入学习。',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      }
    }

    return {}
  }

  // 获取书籍的所有评分
  async getBookRatings(bookId: string): Promise<{ ratings: Rating[], averageRating: number, ratingCount: number }> {
    const data = await this.request<{
      ratings: Rating[],
      averageRating: number,
      ratingCount: number
    }>(`/books/${bookId}/ratings`, {
      headers: this.getHeaders(),
    })
    return data
  }

  // 提交评分
  async submitRating(bookId: string, rating: number): Promise<Rating> {
    const data = await this.request<{ rating: Rating }>('/ratings', {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ bookId, rating }),
    })
    return data.rating
  }

  // 获取用户对特定书籍的评分
  async getUserBookRating(bookId: string, userId: string): Promise<Rating | null> {
    const data = await this.request<{ rating: Rating | null }>(`/books/${bookId}/ratings/user/${userId}`, {
      headers: this.getHeaders(),
    })
    return data.rating
  }

  // 更新评分
  async updateRating(ratingId: string, rating: number): Promise<Rating> {
    const data = await this.request<{ rating: Rating }>(`/ratings/${ratingId}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify({ rating }),
    })
    return data.rating
  }

  // 获取书籍的所有评论
  async getBookComments(bookId: string): Promise<Comment[]> {
    const data = await this.request<{ comments: Comment[] }>(`/books/${bookId}/comments`, {
      headers: this.getHeaders(),
    })
    return data.comments || []
  }

  // 提交评论
  async submitComment(bookId: string, content: string): Promise<Comment> {
    const data = await this.request<{ comment: Comment }>('/comments', {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ bookId, content }),
    })
    return data.comment
  }

  // 删除评论
  async deleteComment(commentId: string): Promise<boolean> {
    try {
      await this.request<void>(`/comments/${commentId}`, {
        method: 'DELETE',
        headers: this.getHeaders(true),
      })
      return true
    } catch (error) {
      console.error('删除评论失败:', error)
      return false
    }
  }

  // 获取所有书本评论（管理用）
  async getAllBookComments(): Promise<Array<Comment & { bookTitle: string }>> {
    const data = await this.request<{ comments: Array<Comment & { bookTitle: string }> }>('/comments/all', {
      method: 'GET',
      headers: this.getHeaders(true),
    })
    return data.comments || []
  }
}

export const ratingService = new RatingService()
