<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

const tabs = computed(() => [
  { label: t('admin.layout.books'), path: '/admin/books', active: route.path.startsWith('/admin/books') },
  { label: t('admin.layout.users'), path: '/admin/users', active: route.path.startsWith('/admin/users') },
  {
    label: t('admin.layout.borrowings'),
    path: '/admin/borrowings',
    active: route.path.startsWith('/admin/borrowings'),
  },
  {
    label: '公告管理',
    path: '/admin/announcements',
    active: route.path.startsWith('/admin/announcements'),
  },
  {
    label: '社区评论管理',
    path: '/admin/comments',
    active: route.path.startsWith('/admin/comments'),
  },
  {
    label: '书本评论管理',
    path: '/admin/book-comments',
    active: route.path.startsWith('/admin/book-comments'),
  },
])
</script>

<template>
  <div class="admin-shell u-stack">
    <header class="admin-header u-split u-wrap">
      <div>
        <p class="eyebrow">{{ t('admin.layout.title') }}</p>
        <h1>Moonshot Library Admin</h1>
        <p class="subtitle">{{ t('admin.layout.subtitle') }}</p>
      </div>
      <RouterLink to="/" class="back-home">← {{ t('common.home') }}</RouterLink>
    </header>

    <nav class="admin-nav u-inline u-inline-sm u-wrap">
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
}

.admin-header {
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: var(--text-xs);
  color: var(--color-subtle);
  margin: 0 0 0.2rem;
}

h1 {
  margin: 0;
}

.subtitle {
  margin: 0.3rem 0 0;
  color: var(--color-muted);
}

.back-home {
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-primary);
}

.admin-nav {
}

.admin-nav a {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
}

.admin-nav a.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-ink);
}

.admin-body {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
