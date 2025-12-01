import type { Rating, Comment } from '@/types/library'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

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
    // 模拟获取书籍评分
    if (path.match(/\/books\/[^/]+\/ratings/) && init?.method === 'GET') {
      return {
        ratings: [],
        averageRating: 4.5,
        ratingCount: 25
      }
    }

    // 模拟提交评分
    if (path.match(/\/ratings/) && init?.method === 'POST') {
      const body = JSON.parse(init.body as string)
      return {
        rating: {
          id: Date.now().toString(),
          ...body,
          createdAt: new Date().toISOString()
        }
      }
    }

    // 模拟获取书籍评论
    if (path.match(/\/books\/[^/]+\/comments/) && init?.method === 'GET') {
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
    if (path.match(/\/comments/) && init?.method === 'POST') {
      const body = JSON.parse(init.body as string)
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
    if (path.match(/\/comments\/[^/]+/) && init?.method === 'DELETE') {
      // 在模拟环境中，删除评论总是成功
      return { success: true }
    }

    // 模拟获取所有书本评论（管理用）
    if (path === '/comments/all' && init?.method === 'GET') {
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
