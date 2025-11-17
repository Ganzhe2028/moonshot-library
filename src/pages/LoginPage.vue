<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>登录</h1>
        <p>欢迎来到 Moonshot Library</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="loginForm.email"
            type="email"
            placeholder="请输入邮箱"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            required
            :disabled="isLoading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="submit-button" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="test-accounts">
        <h4>测试账号（点击自动填充）</h4>
        <button
          v-for="account in testAccounts"
          :key="account.email"
          type="button"
          class="test-account"
          @click="fillWithTestAccount(account)"
          :disabled="isLoading"
        >
          <strong>{{ account.label }}</strong><br>
          {{ account.email }} / {{ account.password }}
        </button>
      </div>

      <div class="auth-footer">
        <p>还没有账号？</p>
        <router-link to="/register" class="link-button">立即注册</router-link>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginForm = reactive({
  email: '',
  password: ''
})

const isLoading = ref(false)
const error = ref('')
const testAccounts = [
  {
    label: '学生账号',
    email: 'student@example.com',
    password: 'password123'
  },
  {
    label: '教师账号',
    email: 'teacher@example.com',
    password: 'password123'
  },
  {
    label: '管理员账号',
    email: 'librarian@example.com',
    password: 'password123'
  }
]

const handleLogin = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const success = await authStore.login(loginForm.email, loginForm.password)
    
    if (success) {
      // 登录成功，跳转到之前想访问的页面或首页
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    } else {
      error.value = authStore.error || '登录失败'
    }
  } catch (err) {
    error.value = '登录过程中发生错误'
    console.error('Login error:', err)
  } finally {
    isLoading.value = false
  }
}

const fillWithTestAccount = (account: { email: string; password: string }) => {
  loginForm.email = account.email
  loginForm.password = account.password
  error.value = ''
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: #6b7280;
  font-size: 1rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.error-message {
  background-color: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  text-align: center;
}

.submit-button {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 0.875rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.test-accounts {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.test-accounts h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
}

.test-account {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.1s;
}

.test-account:last-child {
  margin-bottom: 0;
}

.test-account strong {
  color: #1f2937;
  font-weight: 600;
}

.test-account:hover:not(:disabled) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
}

.test-account:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-footer p {
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.link-button {
  color: #6366f1;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.link-button:hover {
  color: #4f46e5;
}

.demo-info {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.demo-info h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.demo-info p {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0;
}

@media (max-width: 640px) {
  .auth-container {
    padding: 1rem;
  }
  
  .auth-card {
    padding: 2rem;
  }
}
</style>
