<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

const tabs = computed(() => [
  { label: '图书管理', path: '/admin/books', active: route.path.startsWith('/admin/books') },
  { label: '用户列表', path: '/admin/users', active: route.path.startsWith('/admin/users') },
  { label: '借阅记录', path: '/admin/borrowings', active: route.path.startsWith('/admin/borrowings') },
])
</script>

<template>
  <div class="admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">运营后台</p>
        <h1>Moonshot Library Admin</h1>
        <p class="subtitle">快速管理馆藏、用户与借阅状态。</p>
      </div>
      <RouterLink to="/" class="back-home">← 返回用户端</RouterLink>
    </header>

    <nav class="admin-nav">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        :class="{ active: tab.active }"
      >
        {{ tab.label }}
      </RouterLink>
    </nav>

    <section class="admin-body">
      <RouterView />
    </section>
  </div>
</template>

<style scoped>
.admin-shell {
  padding: 1rem 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.8rem;
  color: #8a8e99;
  margin: 0 0 0.2rem;
}

h1 {
  margin: 0;
}

.subtitle {
  margin: 0.3rem 0 0;
  color: #4c4f59;
}

.back-home {
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  border: 1px solid rgba(15, 17, 21, 0.08);
  background: #fff;
  color: #4338ca;
}

.admin-nav {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.admin-nav a {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 17, 21, 0.08);
  background: #fff;
  color: #3b3f55;
}

.admin-nav a.active {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(99, 102, 241, 0.12);
  color: #1f1f25;
}

.admin-body {
  background: #fff;
  border-radius: 24px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 17, 21, 0.05);
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
