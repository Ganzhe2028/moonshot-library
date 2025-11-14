import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/books/:id',
      name: 'book-detail',
      component: () => import('@/pages/BookDetailPage.vue'),
      props: true,
    },
    {
      path: '/borrowings',
      name: 'borrowings',
      component: () => import('@/pages/MyBorrowingsPage.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
