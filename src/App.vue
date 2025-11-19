<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'

const authStore = useAuthStore()
const libraryStore = useLibraryStore()
const route = useRoute()
const router = useRouter()

const userInitials = computed(() => {
  if (!authStore.user) return ''
  const [first = '', second = ''] = authStore.user.name.split(' ')
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase()
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    home: 'Moonshot Library',
    'book-detail': 'Book Detail',
    borrowings: 'My Borrowings',
    login: 'Login',
    register: 'Register',
  }
  const matched = titles[route.name as string]
  return matched ?? 'Moonshot Library'
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
        <RouterLink :class="{ active: route.name === 'home' }" to="/">首页</RouterLink>
        <RouterLink :class="{ active: route.name === 'borrowings' }" to="/borrowings">
          我的借阅
        </RouterLink>
      </nav>

      <div class="auth-section">
        <template v-if="authStore.user">
          <div class="user-pill" :style="{ backgroundColor: authStore.user.avatarColor || '#8b5cf6' }">
            {{ userInitials }}
          </div>
          <button @click="handleLogout" class="logout-button">登出</button>
        </template>
        <template v-else>
          <div class="auth-links">
            <RouterLink to="/login" :class="{ active: route.name === 'login' }">登录</RouterLink>
            <RouterLink to="/register" :class="{ active: route.name === 'register' }">注册</RouterLink>
          </div>
        </template>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="app-footer">
      <p>Moonshot Library System · {{ currentYear }}</p>
      <p>保持每一次阅读的好奇心 📖</p>
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
  background: linear-gradient(135deg, #312e81, #6366f1);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
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
