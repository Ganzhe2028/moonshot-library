import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomePage from '@/pages/HomePage.vue'
import BookDetailPage from '@/pages/BookDetailPage.vue'
import MyBorrowingsPage from '@/pages/MyBorrowingsPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import AuthCallbackPage from '@/pages/AuthCallbackPage.vue'
import AdminLayout from '@/pages/admin/AdminLayout.vue'
import AdminBooksPage from '@/pages/admin/AdminBooksPage.vue'
import AdminUsersPage from '@/pages/admin/AdminUsersPage.vue'
import AdminBorrowingsPage from '@/pages/admin/AdminBorrowingsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/books/:id',
      name: 'book-detail',
      component: BookDetailPage,
    },
    {
      path: '/borrowings',
      name: 'borrowings',
      component: MyBorrowingsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallbackPage,
      // 注意：实际的登录处理逻辑在 App.vue 的 onMounted 钩子中
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, requiresRole: ['admin', 'librarian'] },
      children: [
        {
          path: '',
          redirect: '/admin/books',
        },
        {
          path: 'books',
          name: 'admin-books',
          component: AdminBooksPage,
          meta: { requiresAuth: true, requiresRole: ['admin', 'librarian'] },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: AdminUsersPage,
          meta: { requiresAuth: true, requiresRole: ['admin', 'librarian'] },
        },
        {
          path: 'borrowings',
          name: 'admin-borrowings',
          component: AdminBorrowingsPage,
          meta: { requiresAuth: true, requiresRole: ['admin', 'librarian'] },
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
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
