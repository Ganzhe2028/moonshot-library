import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomePage from '@/pages/HomePage.vue'
import BookDetailPage from '@/pages/BookDetailPage.vue'
import MyBorrowingsPage from '@/pages/MyBorrowingsPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'

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
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查路由是否需要认证
  if (to.meta?.requiresAuth && !authStore.user) {
    // 如果需要认证且用户未登录，重定向到登录页面
    next('/login')
  } else if ((to.name === 'login' || to.name === 'register') && authStore.user) {
    // 如果用户已登录但访问登录/注册页面，重定向到首页
    next('/')
  } else {
    // 其他情况正常导航
    next()
  }
})

export default router
