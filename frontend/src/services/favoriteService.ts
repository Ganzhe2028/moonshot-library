import type { Favorite } from '@/types/library'

const API_BASE_URL = '/api'

class FavoriteService {
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
      const message = result?.message || '收藏接口请求失败'
      throw new Error(message)
    }

    return (result.success && result.data ? result.data : result) as T
  }

  async fetchFavorites(userId: string): Promise<Favorite[]> {
    const data = await this.request<{ favorites: Favorite[] }>(`${API_BASE_URL}/users/${userId}/favorites`, {
      headers: this.getHeaders(),
    })
    return data.favorites || []
  }

  async addFavorite(userId: string, bookId: string): Promise<Favorite> {
    const data = await this.request<{ favorite: Favorite }>(`${API_BASE_URL}/users/${userId}/favorites`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ bookId }),
    })
    return data.favorite
  }

  async removeFavorite(userId: string, bookId: string): Promise<void> {
    await this.request(`${API_BASE_URL}/users/${userId}/favorites/${bookId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
  }
}

export const favoriteService = new FavoriteService()
