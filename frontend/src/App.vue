<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const authStore = useAuthStore()
const libraryStore = useLibraryStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// 防止重复处理M365登录回调
const m365CallbackProcessed = ref(false)

const userInitials = computed(() => {
  if (!authStore.user) return ''
  const [first = '', second = ''] = authStore.user.name.split(' ')
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase()
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    home: t('common.brand'),
    'book-detail': t('bookDetail.info'),
    borrowings: t('borrowings.title'),
    login: t('auth.loginTitle'),
    register: t('auth.registerTitle'),
    admin: t('admin.layout.title'),
  }
  const matched = titles[route.name as string]
  return matched ?? t('common.brand')
})

const currentYear = new Date().getFullYear()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

watch(
  () => authStore.user?.id,
  () => {
    libraryStore.fetchBooks(true)
    libraryStore.fetchBorrowings(true)
  },
  { immediate: true },
)

onMounted(async () => {
  // 检查是否是后端重定向回来的回调（携带token参数）
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const refreshToken = urlParams.get('refreshToken')
  const error = urlParams.get('error')

  // 处理后端重定向回来的token
  if (token && refreshToken && !m365CallbackProcessed.value) {
    try {
      m365CallbackProcessed.value = true

      // 保存token和refreshToken
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('login_method', 'm365')

      // 获取用户信息
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.user) {
            // 保存用户信息到store和localStorage
            authStore.user = data.data.user
            localStorage.setItem('auth_user', JSON.stringify(data.data.user))
          }
        } else {
          console.error('获取用户信息失败:', response.statusText)
        }
      } catch (apiError) {
        console.error('获取用户信息失败:', apiError)
        // 即使获取用户信息失败，也继续流程（token已保存）
      }

      // 获取并清除重定向URL
      const redirectUrl = localStorage.getItem('postLoginRedirect') || '/'
      localStorage.removeItem('postLoginRedirect')

      // 清除URL中的查询参数
      window.history.replaceState({}, document.title, window.location.pathname)

      // 重定向到目标页面
      router.push(redirectUrl)
    } catch (error) {
      console.error('处理M365登录回调失败:', error)
      // 出错时重定向到登录页面
      router.push('/login?error=callback_failed')
    }
  } else if (error && !m365CallbackProcessed.value) {
    // 处理登录错误
    m365CallbackProcessed.value = true
    window.history.replaceState({}, document.title, window.location.pathname)
    router.push(`/login?error=${error}`)
  } else {
    // 正常页面加载，检查用户登录状态
    if (!authStore.user) {
      authStore.initializeAuth()
    }
  }
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">
        <span class="logo-dot" />
        <div>
          <RouterLink class="brand-title" to="/">Moonshot Library</RouterLink>
          <p class="brand-subtitle">{{ pageTitle }}</p>
        </div>
      </div>

      <nav class="app-nav" v-if="authStore.user">
        <RouterLink
          v-if="authStore.isAdmin || authStore.isLibrarian"
          :class="{ active: (route.fullPath || '').startsWith('/admin') }"
          to="/admin"
        >
          {{ t('common.admin') }}
        </RouterLink>
        <RouterLink :class="{ active: route.name === 'home' }" to="/">
          {{ t('common.home') }}
        </RouterLink>
        <RouterLink :class="{ active: route.name === 'borrowings' }" to="/borrowings">
          {{ t('common.borrowings') }}
        </RouterLink>
        <RouterLink :class="{ active: route.name === 'community' }" to="/community">
          {{ t('common.community') }}
        </RouterLink>
      </nav>

      <LanguageSwitcher />

      <div class="auth-section">
        <template v-if="authStore.user">
          <div class="user-pill" :style="{ backgroundColor: authStore.user.avatarColor || '#8b5cf6' }">
            {{ userInitials }}
          </div>
          <button @click="handleLogout" class="logout-button">{{ t('common.logout') }}</button>
        </template>
        <template v-else>
          <div class="auth-links">
            <RouterLink to="/login" :class="{ active: route.name === 'login' }">{{ t('common.login') }}</RouterLink>
            <RouterLink to="/register" :class="{ active: route.name === 'register' }">{{ t('common.register') }}</RouterLink>
          </div>
        </template>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="app-footer">
      <p>{{ t('common.footer', { year: currentYear }) }}</p>
      <p>{{ t('common.tagline') }}</p>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 0 1.5rem;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.logo-dot {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background-image: url('/logo75.png');
  background-size: cover;
  background-position: center;
  box-shadow: 0 8px 24px rgba(183, 181, 235, 0.35);
}

.brand-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.brand-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: #5b5d63;
}

.app-nav {
  display: flex;
  gap: 1rem;
}

.app-nav a {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  font-size: 0.95rem;
  color: #4c4f59;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.app-nav a.active {
  background-color: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.4);
  color: #1f1f25;
}

.auth-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.auth-links {
  display: flex;
  gap: 1rem;
}

.auth-links a {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  font-size: 0.95rem;
  color: #4c4f59;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  text-decoration: none;
}

.auth-links a.active {
  background-color: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.4);
  color: #1f1f25;
}

.logout-button {
  background: transparent;
  color: #dc2626;
  border: 1px solid #dc2626;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background-color: #dc2626;
  color: white;
}

.user-pill {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
}

main {
  flex: 1;
  width: 100%;
}

.app-footer {
  text-align: center;
  font-size: 0.85rem;
  color: #6c6f78;
  padding: 2.5rem 0;
}

@media (max-width: 768px) {
  .app-shell {
    padding: 0 1.2rem;
  }

  .app-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .app-nav {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
