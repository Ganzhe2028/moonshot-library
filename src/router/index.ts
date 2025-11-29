import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import HomePage from '@/pages/HomePage.vue'
import BookDetailPage from '@/pages/BookDetailPage.vue'
import MyBorrowingsPage from '@/pages/MyBorrowingsPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import CommunityPage from '@/pages/CommunityPage.vue'
import AdminLayout from '@/pages/admin/AdminLayout.vue'
import AdminAnnouncementsPage from '@/pages/admin/AdminAnnouncementsPage.vue'
import AdminBooksPage from '@/pages/admin/AdminBooksPage.vue'
import AdminUsersPage from '@/pages/admin/AdminUsersPage.vue'
import AdminBorrowingsPage from '@/pages/admin/AdminBorrowingsPage.vue'
import AdminCommentsPage from '@/pages/admin/AdminCommentsPage.vue'
import AdminBookCommentsPage from '@/pages/admin/AdminBookCommentsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',
      name: 'home',
      component: HomePage,
    },
    { path: '/books/:id',
      name: 'book-detail',
      component: BookDetailPage,
    },
    { path: '/borrowings',
      name: 'borrowings',
      component: MyBorrowingsPage,
      meta: { requiresAuth: true },
    },
    { path: '/login',
      name: 'login',
      component: LoginPage,
    },
    { path: '/community',
      name: 'community',
      component: CommunityPage,
    },
    { path: '/admin',
      name: 'admin',
      component: AdminLayout,
      meta: { requiresAuth: true, requiresRole: ['admin', 'librarian'] },
      children: [
        { path: '', redirect: '/admin/books' },
        { path: 'books', name: 'admin-books', component: AdminBooksPage },
        { path: 'users', name: 'admin-users', component: AdminUsersPage },
        { path: 'borrowings', name: 'admin-borrowings', component: AdminBorrowingsPage },
        { path: 'announcements', name: 'admin-announcements', component: AdminAnnouncementsPage },
        { path: 'comments', name: 'admin-comments', component: AdminCommentsPage },
        { path: 'book-comments', name: 'admin-book-comments', component: AdminBookCommentsPage }
      ]
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// 添加404路由处理
router.addRoute({
  path: '/:pathMatch(.*)*',
  redirect: '/'
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 特殊处理auth-callback路由，允许访问
  if (to.name === 'auth-callback') {
    next()
    return
  }

  // 检查路由是否需要认证
  if (to.meta?.requiresAuth && !authStore.user) {
    // 如果需要认证且用户未登录，重定向到登录页面
    // 保存原始目标，登录后可以重定向回来
    const redirectPath = encodeURIComponent(to.fullPath)
    next(`/login?redirect=${redirectPath}`)
  } else if (to.meta?.requiresRole && authStore.user) {
    // 如果路由需要特定角色且用户已登录，检查用户角色
    const allowedRoles = Array.isArray(to.meta.requiresRole)
      ? to.meta.requiresRole
      : [to.meta.requiresRole]
    if (!allowedRoles.includes(authStore.user.role)) {
      next('/')
    } else {
      next()
    }
  } else if ((to.name === 'login' || to.name === 'register') && authStore.user) {
    // 如果用户已登录但访问登录/注册页面，重定向到首页
    // 检查是否有redirect参数
    const redirectPath = to.query.redirect as string
    next(redirectPath || '/')
  } else {
    // 其他情况正常导航
    next()
  }
})

export default router
