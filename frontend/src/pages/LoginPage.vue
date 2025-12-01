<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>{{ t('auth.loginTitle') }}</h1>
        <p>{{ t('auth.loginSubtitle') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">{{ t('auth.email') }}</label>
          <input
            id="email"
            v-model="loginForm.email"
            type="email"
            :placeholder="t('auth.email')"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">{{ t('auth.password') }}</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            :placeholder="t('auth.password')"
            required
            :disabled="isLoading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="submit-button" :disabled="isLoading">
          {{ isLoading ? t('auth.loggingIn') : t('auth.login') }}
        </button>
      </form>

      <!-- 分隔线 -->
      <div class="divider">
        <div class="divider-line"></div>
        <span class="divider-text">{{ t('auth.divider') }}</span>
        <div class="divider-line"></div>
      </div>

      <!-- Microsoft M365 登录按钮 -->
      <button 
        @click="handleM365Login" 
        class="microsoft-button" 
        :disabled="isLoading"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.46594 12.0484C5.46594 10.3451 6.44643 8.85314 8.00049 8.13696L8.0015 8.13696L8.00099 6.37151L8.00004 6.37151C8.00004 6.37151 5.46503 7.5621 5.46503 10.4702V12.0484Z" fill="#F25022"/>
          <path d="M10.7701 13.3344C10.7701 14.3936 10.2337 15.3269 9.35614 15.7796V17.5451C11.1009 16.8289 12.2534 15.0771 12.2534 13.015V11.4368C12.2534 10.3776 11.717 9.44424 10.8395 9.00502C11.7165 8.55228 12.2529 7.61895 12.2529 6.55973V4.98155C10.5082 5.70203 9.35566 7.44864 9.35566 9.50628C9.35566 10.5655 9.89848 11.4988 10.7701 11.9566V13.3344Z" fill="#7FBA00"/>
          <path d="M13.7623 13.3344C13.7623 14.3936 14.3046 15.3269 15.1827 15.7796V17.5451C13.4324 16.8289 12.2798 15.0771 12.2798 13.015V11.4368C12.2798 10.3776 12.8176 9.44424 13.6956 9.00502C12.8176 8.55228 12.2798 7.61895 12.2798 6.55973V4.98155C13.5418 5.49677 14.5417 6.46003 14.898 7.69024C15.7819 7.24233 16.3297 6.30491 16.3297 5.24194V3.01042H18.6677V5.24194C18.6677 7.94097 16.692 10.1975 13.7623 10.962V12.3343C13.7623 13.3344 13.7623 13.3344 13.7623 13.3344Z" fill="#00A4EF"/>
          <path d="M12.2788 13.015C12.2788 15.0771 13.4314 16.8289 15.1817 17.5451V15.7796C14.3036 15.3269 13.7613 14.3936 13.7613 13.3344V11.9566C14.6329 11.4988 15.1757 10.5655 15.1757 9.50628C15.1757 7.44864 14.0231 5.70203 12.2788 4.98155V6.55973C12.2788 7.61895 11.741 8.55228 10.8581 9.00502C11.7406 9.44424 12.2788 10.3776 12.2788 11.4368V13.015Z" fill="#FFB900"/>
        </svg>
        <span>{{ isLoading ? t('auth.m365Logging') : t('auth.m365') }}</span>
      </button>

      <div class="test-accounts">
        <h4>{{ t('auth.testAccounts') }}</h4>
        <button
          v-for="account in testAccounts"
          :key="account.email"
          type="button"
          class="test-account"
          @click="loginWithTestAccount(account)"
          :disabled="isLoading"
        >
          <strong>{{ t(account.labelKey) }}</strong><br>
          {{ account.email }} / {{ account.password }}
        </button>
      </div>

      <div class="auth-footer">
        <p>{{ t('auth.registerPrompt') }}</p>
        <router-link to="/register" class="link-button">{{ t('auth.registerLink') }}</router-link>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/authService'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const loginForm = reactive({
  email: '',
  password: ''
})

const isLoading = ref(false)
const error = ref('')
const testAccounts = [
  {
    labelKey: 'auth.student',
    email: 'student@example.com',
    password: 'password123'
  },
  {
    labelKey: 'auth.teacher',
    email: 'teacher@example.com',
    password: 'password123'
  },
  {
    labelKey: 'auth.librarian',
    email: 'librarian@example.com',
    password: 'password123'
  }
]

const loginWithCredentials = async (email: string, password: string) => {
  isLoading.value = true
  error.value = ''

  try {
    const success = await authStore.login(email, password)
    if (success) {
      const redirect = (route.query.redirect as string) || '/'
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

const handleLogin = async () => {
  await loginWithCredentials(loginForm.email, loginForm.password)
}

const loginWithTestAccount = async (account: { email: string; password: string }) => {
  loginForm.email = account.email
  loginForm.password = account.password
  await loginWithCredentials(account.email, account.password)
}

// 处理M365 SSO登录（使用后端重定向模式）
const handleM365Login = async () => {
  isLoading.value = true
  error.value = ''

  try {
    // 保存重定向URL
    const redirect = route.query.redirect as string || '/'
    if (redirect) {
      localStorage.setItem('postLoginRedirect', redirect)
    }
    
    // 获取后端生成的Microsoft登录URL并重定向
    const loginUrl = await authService.getM365LoginUrl()
    window.location.href = loginUrl
    // 注意：这里不会执行到finally，因为页面会重定向
  } catch (err) {
    isLoading.value = false
    // 增强错误处理，当MSAL服务不可用时显示友好提示
    if (typeof err === 'object' && err !== null && 'response' in err && 
        typeof err.response === 'object' && err.response !== null && 
        'status' in err.response && err.response.status === 503 &&
        'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null &&
        'error' in err.response.data && err.response.data.error === 'MSAL not configured') {
      error.value = 'Microsoft 365登录服务暂时不可用，请使用其他登录方式'
    } else {
      error.value = err instanceof Error ? err.message : 'Microsoft登录失败'
    }
    console.error('M365 Login error:', err)
  }
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

/* 分隔线样式 */
.divider {
  display: flex;
  align-items: center;
  margin: 2rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.divider-line {
  flex: 1;
  height: 1px;
  background-color: #e5e7eb;
}

.divider-text {
  padding: 0 1rem;
  font-weight: 500;
}

/* Microsoft登录按钮样式 */
.microsoft-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem;
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.microsoft-button:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.microsoft-button:active:not(:disabled) {
  transform: translateY(1px);
}

.microsoft-button:disabled {
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
