<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import type { Comment } from '@/types/library'
import type { CommunityPost } from '@/services/communityService'
import {
  fetchCommunityPosts,
  createCommunityPost,
  togglePostLike,
  fetchPostComments,
  addPostComment,
  deletePostComment,
  getUserLikedPostIds
} from '@/services/communityService'

// 定义本地类型接口
interface User {
  id: string
  name: string
  email?: string
  total_words_read?: number
  avatarColor?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  author: string
}

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)
const isLoggedIn = computed(() => !!currentUser.value)

// 排行榜数据
const readingStars = ref<User[]>([])
const loadingStars = ref(true)

// UGC动态数据
const communityPosts = ref<CommunityPost[]>([])
const likedPostIds = ref<string[]>([])
const loadingCommunity = ref(true)

// 公告数据
const announcements = ref<Announcement[]>([
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
  }
])

// 新动态表单
const newPostContent = ref('')
const newPostImages = ref<string[]>([])
const loadingPosts = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// 评论相关状态
const postComments = ref<Record<string, Comment[]>>({})
const newComments = ref<Record<string, string>>({})
const showComments = ref<Record<string, boolean>>({})
const loadingComments = ref<Record<string, boolean>>({})
const submittingComments = ref<Record<string, boolean>>({})

// 触发图片上传
const triggerImageUpload = () => {
  fileInput.value?.click()
}

// 处理图片上传
const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  Array.from(input.files).forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        newPostImages.value.push(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  })

  // 重置input，允许重复选择同一文件
  input.value = ''
}

// 删除图片
const removeImage = (index: number) => {
  newPostImages.value.splice(index, 1)
}

// 加载社区动态
const loadCommunityPosts = async () => {
  loadingCommunity.value = true
  try {
    communityPosts.value = await fetchCommunityPosts()
  } catch (error) {
    console.error('加载社区动态失败:', error)
    communityPosts.value = []
  } finally {
    loadingCommunity.value = false
  }
}

// 刷新当前用户的点赞记录
const refreshUserLikes = () => {
  const userId = currentUser.value?.id
  likedPostIds.value = userId ? getUserLikedPostIds(userId) : []
}

// 判断动态是否已被当前用户点赞
const isPostLiked = (postId: string): boolean => likedPostIds.value.includes(postId)

// 获取阅读之星排行榜
const fetchReadingStars = async () => {
  loadingStars.value = true
  try {
    // 从localStorage获取用户数据
    const usersJson = localStorage.getItem('users') || localStorage.getItem('userList')
    let users: User[] = []

    if (usersJson) {
      // 尝试解析用户列表
      try {
        users = JSON.parse(usersJson)
      } catch (parseError) {
        console.warn('解析用户列表失败，使用默认数据:', parseError)
      }
    }

    // 如果没有用户数据或用户列表为空，使用一些默认数据确保排行榜有内容显示
    if (!users || users.length === 0) {
      users = [
        {
          id: '1',
          name: '张小明',
          avatarColor: '#3b82f6',
          total_words_read: Math.floor(Math.random() * 500000 + 100000)
        },
        {
          id: '2',
          name: '李华',
          avatarColor: '#ef4444',
          total_words_read: Math.floor(Math.random() * 400000 + 80000)
        },
        {
          id: '3',
          name: '王小红',
          avatarColor: '#10b981',
          total_words_read: Math.floor(Math.random() * 300000 + 50000)
        },
        {
          id: '4',
          name: '赵强',
          avatarColor: '#f59e0b',
          total_words_read: Math.floor(Math.random() * 250000 + 30000)
        },
        {
          id: '5',
          name: '陈静',
          avatarColor: '#8b5cf6',
          total_words_read: Math.floor(Math.random() * 200000 + 20000)
        }
      ]
    }

    // 确保用户有必要的字段
    const validUsers = users
      .filter(user => user.name && (user.total_words_read || 0) > 0)
      .map(user => ({
        id: user.id || Date.now().toString() + Math.random(),
        name: user.name || '未知用户',
        avatarColor: user.avatarColor || generateAvatarColor(),
        total_words_read: user.total_words_read || 0
      }))

    // 按总阅读字数排序，只取前10名
    readingStars.value = validUsers
      .sort((a, b) => (b.total_words_read || 0) - (a.total_words_read || 0))
      .slice(0, 10)
  } catch (error) {
    console.error('获取阅读之星失败:', error)
  } finally {
    loadingStars.value = false
  }
}

// 生成随机头像颜色
const generateAvatarColor = (): string => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#6366f1'
  ]
  const index = Math.floor(Math.random() * colors.length)
  return colors[index] || '#3b82f6' // 确保总是返回一个字符串
}

// 发布新动态
const publishPost = async () => {
  if (!newPostContent.value.trim() && newPostImages.value.length === 0) return
  if (!isLoggedIn.value || !currentUser.value) {
    alert('请先登录后再发布动态')
    return
  }

  loadingPosts.value = true
  try {
    const newPost = await createCommunityPost({
      userId: currentUser.value.id,
      userName: currentUser.value.name || '匿名用户',
      userAvatar: currentUser.value.avatarColor || '#6b7280',
      content: newPostContent.value,
      images: [...newPostImages.value]
    })

    communityPosts.value.unshift(newPost)

    // 重置表单
    newPostContent.value = ''
    newPostImages.value = []
  } catch (error) {
    console.error('发布动态失败:', error)
  } finally {
    loadingPosts.value = false
  }
}

// 格式化日期
const formatDate = (dateString?: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    return diffHours === 0 ? '刚刚' : `${diffHours}小时前`
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 切换点赞
const toggleLike = async (postId: string) => {
  if (!isLoggedIn.value || !currentUser.value) {
    alert('请先登录后再点赞')
    return
  }

  try {
    const { likes, liked } = await togglePostLike(postId, currentUser.value.id)
    const postIndex = communityPosts.value.findIndex(post => post.id === postId)

    if (postIndex !== -1 && communityPosts.value[postIndex]) {
      communityPosts.value[postIndex].likes = likes
    }

    if (liked && !likedPostIds.value.includes(postId)) {
      likedPostIds.value.push(postId)
    } else if (!liked && likedPostIds.value.includes(postId)) {
      likedPostIds.value = likedPostIds.value.filter(id => id !== postId)
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 切换评论区显示状态
const toggleComments = async (postId: string) => {
  if (showComments.value[postId]) {
    showComments.value[postId] = false
    return
  }

  showComments.value[postId] = true
  await loadComments(postId)
}

// 加载评论
const loadComments = async (postId: string) => {
  loadingComments.value[postId] = true
  try {
    const comments = await fetchPostComments(postId)
    postComments.value[postId] = comments || []
  } catch (error) {
    console.error('加载评论失败:', error)
    postComments.value[postId] = []
  } finally {
    loadingComments.value[postId] = false
  }
}

// 提交评论
const submitComment = async (postId: string) => {
  if (!isLoggedIn.value || !newComments.value[postId]?.trim()) return

  submittingComments.value[postId] = true
  try {
    const content = newComments.value[postId].trim()
    const user = currentUser.value

    if (!user) return

    const newComment = await addPostComment(postId, {
      userId: user.id,
      userName: user.name || '未知用户',
      content,
      bookId: '' // 社区评论不需要bookId
    })

    // 更新评论列表
    if (!postComments.value[postId]) {
      postComments.value[postId] = []
    }
    postComments.value[postId].push(newComment)
    newComments.value[postId] = ''

    // 更新帖子的评论数
    const postIndex = communityPosts.value.findIndex(p => p.id === postId)
    if (postIndex !== -1 && communityPosts.value[postIndex]) {
      communityPosts.value[postIndex].comments = (communityPosts.value[postIndex].comments || 0) + 1
    }
  } catch (error) {
    console.error('提交评论失败:', error)
  } finally {
    submittingComments.value[postId] = false
  }
}

// 删除评论
const handleDeleteComment = async (postId: string, commentId: string) => {
  if (!confirm('确定要删除这条评论吗？')) return

  try {
    await deletePostComment(postId, commentId)

    // 更新评论列表
    if (postComments.value[postId]) {
      postComments.value[postId] = postComments.value[postId].filter(
        comment => comment.id !== commentId
      )
    }

    // 更新帖子的评论数
    const postIndex = communityPosts.value.findIndex(p => p.id === postId)
    if (postIndex !== -1 && communityPosts.value[postIndex]) {
      communityPosts.value[postIndex].comments = Math.max(
        0,
        (communityPosts.value[postIndex].comments || 0) - 1
      )
    }
  } catch (error) {
    console.error('删除评论失败:', error)
  }
}

// 格式化字数
const formatWordCount = (count?: number): string => {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  return count.toString()
}

onMounted(() => {
  fetchReadingStars()
  refreshUserLikes()
  loadCommunityPosts()

  // 设置定时刷新，每30秒更新一次排行榜数据
  const refreshInterval = setInterval(() => {
    fetchReadingStars()
  }, 30000) // 30秒

  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(refreshInterval)
  })
})

watch(currentUser, () => {
  refreshUserLikes()
})
</script>

<template>
  <div class="community-page">
    <header class="page-header">
      <h1>社区</h1>
      <p class="subtitle">与书友分享阅读心得，交流读书乐趣</p>
    </header>

    <div class="community-container">
      <!-- 左侧：排行榜和公告栏 -->
      <div class="sidebar-left">
        <!-- 阅读之星排行榜 -->
        <section class="leaderboard">
          <h2 class="section-title">阅读之星</h2>
          <div v-if="loadingStars" class="loading">加载中...</div>
          <div v-else class="leaderboard-list">
            <div v-for="(user, index) in readingStars" :key="user.id" class="leaderboard-item">
              <div class="rank">{{ index + 1 }}</div>
              <div class="user-info">
                <div class="avatar" :style="{ backgroundColor: user.avatarColor }">
                  {{ user.name?.charAt(0) }}
                </div>
                <div>
                  <p class="user-name">{{ user.name }}</p>
                  <p class="word-count">{{ formatWordCount(user.total_words_read) }}字</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 公告栏 -->
        <section class="announcements">
          <h2 class="section-title">公告栏</h2>
          <div class="announcement-list">
            <div v-for="announcement in announcements" :key="announcement.id" class="announcement-item">
              <h3 class="announcement-title">{{ announcement.title }}</h3>
              <p class="announcement-content">{{ announcement.content }}</p>
              <p class="announcement-meta">
                {{ announcement.author }} · {{ formatDate(announcement.createdAt) }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- 右侧：UGC动态 -->
      <div class="content-right">
        <!-- 发布动态表单 -->
        <section class="post-form" v-if="isLoggedIn">
          <div class="form-header">
            <div class="avatar" :style="{ backgroundColor: currentUser?.avatarColor || '#6b7280' }">
              {{ currentUser?.name?.charAt(0) }}
            </div>
            <p class="user-name">{{ currentUser?.name }}</p>
          </div>
          <textarea
            v-model="newPostContent"
            placeholder="分享你的阅读心得..."
            rows="4"
          ></textarea>

          <!-- 图片预览区域 -->
          <div v-if="newPostImages.length > 0" class="image-previews">
            <div v-for="(img, index) in newPostImages" :key="index" class="image-preview">
              <img :src="img" alt="Preview" class="preview-img">
              <button type="button" class="remove-img" @click="removeImage(index)">×</button>
            </div>
          </div>

          <div class="form-actions">
            <!-- 图片上传按钮 -->
            <button type="button" class="upload-btn" @click="triggerImageUpload">
              📷 上传图片
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              style="display: none"
              @change="handleImageUpload"
            >
            <BaseButton
              type="button"
              variant="primary"
              size="sm"
              class="publish"
              @click="publishPost"
              :disabled="(!newPostContent.trim() && newPostImages.length === 0) || loadingPosts"
            >
              {{ loadingPosts ? '发布中...' : '发布' }}
            </BaseButton>
          </div>
        </section>

        <!-- 社区动态列表 -->
        <section class="posts">
          <h2 class="section-title">社区动态</h2>
          <div v-if="loadingCommunity" class="loading">
            加载中...
          </div>
          <div v-else-if="communityPosts.length === 0" class="empty">
            <p>暂无动态，快来发布第一条吧！</p>
          </div>
          <div v-else class="post-list">
            <article v-for="post in communityPosts" :key="post.id" class="post">
              <div class="post-header">
                <div class="avatar" :style="{ backgroundColor: post.userAvatar }">
                  {{ post.userName.charAt(0) }}
                </div>
                <div class="user-info">
                  <p class="user-name">{{ post.userName }}</p>
                  <p class="post-time">{{ formatDate(post.createdAt) }}</p>
                </div>
              </div>
              <div class="post-content">{{ post.content }}</div>
              <div v-if="post.images.length" class="post-images">
                <img v-for="(img, index) in post.images" :key="index" :src="img" alt="Post image">
              </div>
              <div class="post-actions">
                <button
                  type="button"
                  class="action-btn"
                  :class="{ active: isPostLiked(post.id) }"
                  @click="toggleLike(post.id)"
                >
                  👍 {{ post.likes }}
                </button>
                <button
                  type="button"
                  class="action-btn"
                  @click="toggleComments(post.id)"
                >
                  💬 {{ post.comments }}
                </button>
              </div>

              <!-- 评论区 -->
              <div v-if="showComments[post.id]" class="comments-section">
                <div v-if="loadingComments[post.id]" class="loading-comments">
                  加载评论中...
                </div>
                <div v-else class="comments-list">
                  <div
                    v-for="comment in postComments[post.id] || []"
                    :key="comment.id"
                    class="comment-item"
                  >
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.userName }}</span>
                      <div class="comment-actions">
                        <span class="comment-date">{{ formatDate(comment.createdAt || new Date().toISOString()) }}</span>
                        <button
                          v-if="authStore.isAdmin || authStore.isLibrarian"
                          class="delete-comment-btn"
                          @click="handleDeleteComment(post.id, comment.id)"
                          title="删除评论"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <div class="comment-content">{{ comment.content }}</div>
                  </div>

                  <div v-if="(postComments[post.id] || []).length === 0" class="no-comments">
                    暂无评论，快来发表第一条评论吧！
                  </div>
                </div>

                <!-- 评论输入框 -->
                <div v-if="isLoggedIn" class="comment-input-section">
                  <textarea
                    v-model="newComments[post.id]"
                    placeholder="写下你的评论..."
                    rows="2"
                    class="comment-input"
                  ></textarea>
                  <button
                    class="submit-comment-btn"
                    @click="submitComment(post.id)"
                    :disabled="!newComments[post.id]?.trim() || submittingComments[post.id]"
                  >
                    {{ submittingComments[post.id] ? '提交中...' : '发表评论' }}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.community-page {
  padding: 1rem 0 3rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  margin: 0;
}

.subtitle {
  color: var(--color-subtle);
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.community-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.sidebar-left {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.leaderboard,
.announcements {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

.section-title {
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
}

.leaderboard-item .rank {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  width: 32px;
  text-align: center;
}

.leaderboard-item:nth-child(1) .rank {
  color: var(--color-warning);
}

.leaderboard-item:nth-child(2) .rank {
  color: var(--color-subtle);
}

.leaderboard-item:nth-child(3) .rank {
  color: var(--color-warning-strong);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex: 1;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

.user-name {
  margin: 0;
  font-weight: 500;
}

.word-count {
  margin: 0;
  color: var(--color-subtle);
  font-size: 0.85rem;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.announcement-item {
  padding: 1rem;
  border-radius: var(--radius-lg);
  background: var(--color-warning-soft);
  border: 1px solid var(--color-border);
}

.announcement-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-warning-strong);
}

.announcement-content {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--color-muted);
}

.announcement-meta {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-subtle);
}

.content-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-form {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  font-size: 1rem;
  resize: vertical;
  font-family: inherit;
  background: var(--color-surface-soft);
  color: var(--color-ink);
}

textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.image-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.image-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xs);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: var(--color-surface);
  border: none;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  background: var(--chip-bg);
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.65rem 1.2rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 1rem;
}

.upload-btn:hover {
  background: var(--color-surface-soft);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.publish {
  flex-shrink: 0;
}

.posts {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post {
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.post:last-child {
  border-bottom: none;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.post-time {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-subtle);
}

.post-content {
  margin: 0 0 1rem 0;
  line-height: 1.6;
  color: var(--color-ink);
}

.post-images {
  margin-bottom: 1rem;
}

.post-images img {
  max-width: 100%;
  border-radius: var(--radius-sm);
  margin-right: 0.5rem;
}

.post-actions {
  display: flex;
  gap: 1.5rem;
}

.action-btn {
  background: none;
  border: none;
  color: var(--color-subtle);
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0;
}

.action-btn:hover {
  color: var(--color-primary);
}

.action-btn.active {
  color: var(--color-primary);
  font-weight: 600;
}

/* 评论相关样式 */
.comments-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.loading-comments {
  text-align: center;
  padding: 1rem;
  color: var(--color-subtle);
  font-size: 0.9rem;
}

.comments-list {
  margin-bottom: 1rem;
}

.comment-item {
  margin-bottom: 0.8rem;
  padding: 0.8rem;
  background: var(--color-surface-soft);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.comment-author {
  font-weight: 600;
  color: var(--color-ink);
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.comment-date {
  color: var(--color-subtle);
  font-size: 0.8rem;
}

.delete-comment-btn {
  background: none;
  border: none;
  color: var(--color-danger);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-xs);
  transition: background-color 0.2s ease;
}

.delete-comment-btn:hover {
  background-color: var(--color-danger-soft);
}

.comment-content {
  color: var(--color-muted);
  line-height: 1.5;
  font-size: 0.95rem;
}

.no-comments {
  text-align: center;
  padding: 1rem;
  color: var(--color-subtle);
  font-size: 0.9rem;
}

.comment-input-section {
  margin-top: 1rem;
}

.comment-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.6rem;
  font-size: 0.95rem;
  resize: vertical;
  font-family: inherit;
  background: var(--color-surface-soft);
  color: var(--color-ink);
}

.comment-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.submit-comment-btn {
  margin-top: 0.5rem;
  background: var(--color-primary);
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-md);
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.submit-comment-btn:hover:not(:disabled) {
  background: var(--color-primary-strong);
}

.submit-comment-btn:disabled {
  background: var(--color-primary-soft);
  color: var(--color-muted);
  cursor: not-allowed;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: var(--color-subtle);
}

.loading {
  text-align: center;
  padding: 1rem;
  color: var(--color-subtle);
}

@media (max-width: 768px) {
  .community-container {
    grid-template-columns: 1fr;
  }

  .sidebar-left {
    order: 2;
  }

  .content-right {
    order: 1;
  }
}
</style>
