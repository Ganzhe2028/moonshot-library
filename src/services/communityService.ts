import type { Comment } from '@/types/library'

// 定义社区动态类型
export interface CommunityPost {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  images: string[]
  likes: number
  comments: number
  createdAt: string
}

// 默认的社区动态数据
const defaultCommunityPosts: CommunityPost[] = [
  {
    id: '1',
    userId: '1',
    userName: '张小明',
    userAvatar: '#3b82f6',
    content: '最近读完了《百年孤独》，马尔克斯的魔幻现实主义手法令人惊叹，时间的循环往复和家族命运的交织让人深思。',
    images: [],
    likes: 23,
    comments: 5,
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    userId: '2',
    userName: '李华',
    userAvatar: '#ef4444',
    content: '分享一下我的读书笔记，最近读了《人类简史》，对历史发展的脉络有了新的理解。',
    images: ['book1.jpg'],
    likes: 18,
    comments: 3,
    createdAt: '2024-01-14T15:20:00Z'
  }
]

// 社区服务实现

// 获取社区动态数据
const getCommunityPosts = (): CommunityPost[] => {
  try {
    const stored = localStorage.getItem('communityPosts')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : defaultCommunityPosts
      } catch (e) {
        console.error('解析本地存储的社区动态数据失败:', e)
        return defaultCommunityPosts
      }
    }
    // 保存默认数据到localStorage
    localStorage.setItem('communityPosts', JSON.stringify(defaultCommunityPosts))
    return defaultCommunityPosts
  } catch (error) {
    console.error('获取社区动态数据失败:', error)
    return defaultCommunityPosts
  }
}

// 保存社区动态数据
const saveCommunityPosts = (posts: CommunityPost[]) => {
  localStorage.setItem('communityPosts', JSON.stringify(posts))
}

// 获取评论数据
const getComments = (type: 'book' | 'post', id: string): Comment[] => {
  try {
    const key = `${type}:${id}`
    const stored = localStorage.getItem('comments')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const allComments = typeof parsed === 'object' && parsed !== null ? parsed : {}
        return Array.isArray(allComments[key]) ? allComments[key] : []
      } catch (e) {
        console.error('解析本地存储的评论数据失败:', e)
        return []
      }
    }
    return []
  } catch (error) {
    console.error('获取评论数据失败:', error)
    return []
  }
}

// 保存评论数据
const saveComments = (type: 'book' | 'post', id: string, comments: Comment[]) => {
  try {
    const key = `${type}:${id}`
    const stored = localStorage.getItem('comments')
    let allComments: Record<string, Comment[]> = {}

    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        allComments = typeof parsed === 'object' && parsed !== null ? parsed : {}
      } catch (e) {
        console.error('解析本地存储的评论数据失败:', e)
      }
    }

    allComments[key] = Array.isArray(comments) ? comments : []
    localStorage.setItem('comments', JSON.stringify(allComments))
  } catch (error) {
    console.error('保存评论数据失败:', error)
  }
}

/**
 * 获取所有社区动态
 */
export const fetchCommunityPosts = async (): Promise<CommunityPost[]> => {
  try {
    // 尝试从API获取数据
    // const response = await api.get('/community/posts')
    // return response.data

    // 使用本地存储的数据
    const posts = getCommunityPosts()
    return posts.sort((a, b) => {
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime()
      const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime()
      return timeB - timeA
    })
  } catch (error) {
    console.error('获取社区动态失败:', error)
    return []
  }
}

/**
 * 创建新的社区动态
 */
export const createCommunityPost = async (post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<CommunityPost> => {
  try {
    // 验证输入
    if (!post || typeof post !== 'object') {
      throw new Error('无效的动态数据')
    }

    // 尝试调用API
    // const response = await api.post('/community/posts', post)
    // return response.data

    // 使用本地存储模拟创建
    const newPost: CommunityPost = {
      ...post,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      images: Array.isArray(post.images) ? post.images : []
    }

    const posts = getCommunityPosts()
    posts.unshift(newPost)
    saveCommunityPosts(posts)
    return newPost
  } catch (error) {
    console.error('创建社区动态失败:', error)
    throw error
  }
}

/**
 * 删除社区动态
 */
export const deleteCommunityPost = async (postId: string): Promise<boolean> => {
  try {
    if (!postId || typeof postId !== 'string') {
      throw new Error('无效的动态ID')
    }

    // 尝试调用API
    // await api.delete(`/community/posts/${postId}`)
    // return true

    // 使用本地存储模拟删除
    const posts = getCommunityPosts()
    const filteredPosts = posts.filter(post => post.id !== postId)

    if (filteredPosts.length === posts.length) {
      throw new Error('社区动态不存在')
    }

    saveCommunityPosts(filteredPosts)

    // 同时删除该动态的所有评论
    saveComments('post', postId, [])

    return true
  } catch (error) {
    console.error('删除社区动态失败:', error)
    throw error
  }
}

/**
 * 获取社区动态的评论
 */
export const fetchPostComments = async (postId: string): Promise<Comment[]> => {
  try {
    // 尝试从API获取数据
    // const response = await api.get(`/community/posts/${postId}/comments`)
    // return response.data

    // 使用本地存储的数据
    return getComments('post', postId)
  } catch (error) {
    console.error('获取社区动态评论失败:', error)
    return []
  }
}

/**
 * 添加社区动态评论
 */
export const addPostComment = async (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> => {
  try {
    if (!postId || typeof postId !== 'string') {
      throw new Error('无效的动态ID')
    }
    if (!comment || typeof comment !== 'object') {
      throw new Error('无效的评论数据')
    }

    // 尝试调用API
    // const response = await api.post(`/community/posts/${postId}/comments`, comment)
    // return response.data

    // 使用本地存储模拟添加
    const newComment: Comment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }

    const comments = getComments('post', postId)
    comments.push(newComment)
    saveComments('post', postId, comments)

    // 更新动态的评论数
    const posts = getCommunityPosts()
    const postIndex = posts.findIndex(p => p.id === postId)
    if (postIndex !== -1 && posts[postIndex]) {
      posts[postIndex].comments = (posts[postIndex].comments || 0) + 1
      saveCommunityPosts(posts)
    }

    return newComment
  } catch (error) {
    console.error('添加社区动态评论失败:', error)
    throw error
  }
}

/**
 * 删除社区动态评论
 */
export const deletePostComment = async (postId: string, commentId: string): Promise<boolean> => {
  try {
    if (!postId || typeof postId !== 'string') {
      throw new Error('无效的动态ID')
    }
    if (!commentId || typeof commentId !== 'string') {
      throw new Error('无效的评论ID')
    }

    // 尝试调用API
    // await api.delete(`/community/posts/${postId}/comments/${commentId}`)
    // return true

    // 使用本地存储模拟删除
    const comments = getComments('post', postId)
    const filteredComments = comments.filter(comment => comment.id !== commentId)

    if (filteredComments.length === comments.length) {
      throw new Error('评论不存在')
    }

    saveComments('post', postId, filteredComments)

    // 更新动态的评论数
    const posts = getCommunityPosts()
    const postIndex = posts.findIndex(p => p.id === postId)
    if (postIndex !== -1 && posts[postIndex]) {
      posts[postIndex].comments = Math.max(0, (posts[postIndex].comments || 0) - 1)
      saveCommunityPosts(posts)
    }

    return true
  } catch (error) {
    console.error('删除社区动态评论失败:', error)
    throw error
  }
}

/**
 * 获取所有评论（用于管理后台）
 */
export const fetchAllComments = async (): Promise<Array<{ post: CommunityPost, comment: Comment }>> => {
  try {
    const posts = getCommunityPosts()
    const allComments: Array<{ post: CommunityPost, comment: Comment }> = []

    // 遍历所有动态，收集所有评论
    posts.forEach(post => {
      if (!post || !post.id) return
      const comments = getComments('post', post.id)
      comments.forEach(comment => {
        if (comment) {
          allComments.push({ post, comment })
        }
      })
    })

    // 按时间倒序排序
    return allComments.sort((a, b) => {
      const dateA = new Date(a.comment.createdAt || new Date().toISOString())
      const dateB = new Date(b.comment.createdAt || new Date().toISOString())
      const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime()
      const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime()
      return timeB - timeA
    })
  } catch (error) {
    console.error('获取所有评论失败:', error)
    return []
  }
}
