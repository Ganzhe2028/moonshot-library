<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()

const roleFilter = ref<'all' | 'student' | 'teacher' | 'librarian' | 'admin'>('all')

const users = computed(() => {
  if (roleFilter.value === 'all') return adminStore.users
  return adminStore.users.filter((user) => user.role === roleFilter.value)
})

const membershipBadge = (status?: string) => {
  switch (status) {
    case 'active':
      return { text: '正常', className: 'green' }
    case 'suspended':
      return { text: '暂停', className: 'red' }
    default:
      return { text: status || '未知', className: 'gray' }
  }
}

const reload = () => adminStore.fetchUsers(true)

onMounted(() => {
  adminStore.fetchUsers()
})
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <div>
        <p class="eyebrow">用户</p>
        <h2>用户列表</h2>
      </div>
      <div class="actions">
        <select v-model="roleFilter">
          <option value="all">全部角色</option>
          <option value="student">学生</option>
          <option value="teacher">教师</option>
          <option value="librarian">图书管理员</option>
          <option value="admin">管理员</option>
        </select>
        <button type="button" class="ghost" @click="reload">刷新</button>
      </div>
    </div>

    <div v-if="adminStore.usersLoading" class="hint">正在加载用户列表...</div>
    <p v-else-if="adminStore.usersError" class="alert error">{{ adminStore.usersError }}</p>
    <div v-else class="table">
      <div class="table-head">
        <span>姓名 / 邮箱</span>
        <span>角色</span>
        <span>会员状态</span>
        <span>年级</span>
      </div>
      <div v-for="user in users" :key="user.id" class="table-row">
        <div>
          <p class="title">{{ user.name }}</p>
          <p class="meta">{{ user.email }}</p>
        </div>
        <span class="pill gray">{{ user.role }}</span>
        <span :class="['pill', membershipBadge(user.membership).className]">
          {{ membershipBadge(user.membership).text }}
        </span>
        <span>{{ user.grade || '--' }}</span>
      </div>
      <p v-if="!users.length" class="hint">暂无用户数据。</p>
    </div>
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid rgba(15, 17, 21, 0.05);
  border-radius: 18px;
  padding: 1rem;
  background: #fff;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  color: #8a8e99;
  margin: 0 0 0.25rem;
}

.panel h2 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

select {
  border: 1px solid rgba(15, 17, 21, 0.1);
  border-radius: 10px;
  padding: 0.5rem;
  background: rgba(249, 250, 255, 0.8);
}

.ghost {
  background: rgba(15, 17, 21, 0.05);
  border: 1px solid rgba(15, 17, 21, 0.06);
  border-radius: 10px;
  padding: 0.5rem 0.8rem;
  color: #1f1f25;
}

.table {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 0.6rem;
  align-items: center;
}

.table-head {
  font-weight: 600;
  color: #4c4f59;
}

.table-row {
  padding: 0.7rem;
  border: 1px solid rgba(15, 17, 21, 0.05);
  border-radius: 12px;
}

.title {
  margin: 0;
  font-weight: 600;
}

.meta {
  margin: 0.1rem 0 0;
  color: #6c6f78;
  font-size: 0.9rem;
}

.pill {
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.85rem;
  text-align: center;
}

.pill.green {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.pill.red {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.pill.gray {
  background: rgba(107, 114, 128, 0.15);
  color: #374151;
}

.alert {
  margin-top: 0.5rem;
  padding: 0.65rem 0.8rem;
  border-radius: 10px;
  font-size: 0.95rem;
}

.alert.error {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.hint {
  color: #6c6f78;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .table-head,
  .table-row {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}
</style>
