import type { Announcement } from '@/types/library'

// 默认的公告数据
const defaultMockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '春节假期图书馆开放通知',
    content: '春节期间（2月10日-2月17日）图书馆闭馆，2月18日正常开放。祝大家新春快乐！',
    createdAt: '2024-01-20T09:00:00Z',
    author: '管理员'
  },
  {
    id: '2',
    title: '新书推荐活动开始啦',
    content: '本月新书推荐活动已开始，欢迎大家前来借阅最新上架的图书！',
    createdAt: '2024-01-10T14:30:00Z',
    author: '管理员'
  },
  {
    id: '3',
    title: '读书分享会预告',
    content: '下周六下午2点将举办《百年孤独》读书分享会，欢迎各位读者参加！',
    createdAt: '2024-01-05T10:00:00Z',
    author: '管理员'
  }
]

// 获取当前的公告数据
const getMockAnnouncements = (): Announcement[] => {
  const stored = localStorage.getItem('mockAnnouncements')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('解析本地存储的公告数据失败:', e)
      return defaultMockAnnouncements
    }
  }
  // 如果没有存储的公告，使用默认数据并保存到localStorage
  saveMockAnnouncements(defaultMockAnnouncements)
  return defaultMockAnnouncements
}

// 保存公告数据到localStorage
const saveMockAnnouncements = (announcements: Announcement[]) => {
  localStorage.setItem('mockAnnouncements', JSON.stringify(announcements))
}

/**
 * 获取公告列表
 * @param limit 限制数量
 * @returns 公告列表
 */
export const getAnnouncements = async (limit?: number): Promise<Announcement[]> => {
  try {
    // 尝试从API获取数据
    // const response = await api.get('/announcements', { params: { limit } })
    // return response.data

    // 使用mock数据
    const result = [...getMockAnnouncements()].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return limit ? result.slice(0, limit) : result
  } catch (error) {
    console.error('获取公告列表失败:', error)
    // 发生错误时返回mock数据
    return getMockAnnouncements()
  }
}

/**
 * 获取单个公告详情
 * @param id 公告ID
 * @returns 公告详情
 */
export const getAnnouncementById = async (id: string): Promise<Announcement | null> => {
  try {
    // 尝试从API获取数据
    // const response = await api.get(`/announcements/${id}`)
    // return response.data

    // 使用mock数据
    const announcement = getMockAnnouncements().find(a => a.id === id)
    return announcement || null
  } catch (error) {
    console.error(`获取公告详情失败 (ID: ${id}):`, error)
    return null
  }
}

/**
 * 创建新公告
 * @param announcement 公告数据
 * @returns 创建的公告
 */
export const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
  try {
    // 尝试调用API
    // const response = await api.post('/announcements', announcement)
    // return response.data

    // 使用mock数据模拟创建
    const newAnnouncement: Announcement = {
      ...announcement,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }

    const announcements = getMockAnnouncements()
    announcements.unshift(newAnnouncement)
    saveMockAnnouncements(announcements)
    return newAnnouncement
  } catch (error) {
    console.error('创建公告失败:', error)
    throw error
  }
}

/**
 * 更新公告
 * @param id 公告ID
 * @param announcement 更新的公告数据
 * @returns 更新后的公告
 */
export const updateAnnouncement = async (id: string, announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
  try {
    // 尝试调用API
    // const response = await api.put(`/announcements/${id}`, announcement)
    // return response.data

    // 使用mock数据模拟更新
    const announcements = getMockAnnouncements()
    const index = announcements.findIndex(a => a.id === id)
    if (index === -1) {
      throw new Error('公告不存在')
    }

    // 保留原始创建时间和ID，只更新其他字段
    const originalAnnouncement = announcements[index];
    if (!originalAnnouncement) {
      throw new Error('公告不存在');
    }
    const updatedAnnouncement: Announcement = {
      ...originalAnnouncement,
      ...announcement,
      // 确保id和createdAt字段存在且为字符串类型
      id: originalAnnouncement.id,
      createdAt: originalAnnouncement.createdAt
    }

    announcements[index] = updatedAnnouncement
    saveMockAnnouncements(announcements)
    return updatedAnnouncement
  } catch (error) {
    console.error('更新公告失败:', error)
    throw error
  }
}

/**
 * 删除公告
 * @param id 公告ID
 * @returns 是否删除成功
 */
export const deleteAnnouncement = async (id: string): Promise<boolean> => {
  try {
    // 尝试调用API
    // await api.delete(`/announcements/${id}`)
    // return true

    // 使用mock数据模拟删除
    const announcements = getMockAnnouncements()
    const filteredAnnouncements = announcements.filter(a => a.id !== id)

    if (filteredAnnouncements.length === announcements.length) {
      throw new Error('公告不存在')
    }

    saveMockAnnouncements(filteredAnnouncements)
    return true
  } catch (error) {
    console.error('删除公告失败:', error)
    throw error
  }
}

// 更新公告函数已在上方定义



// 导出默认对象
export default {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
}
