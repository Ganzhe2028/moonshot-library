<template>
  <div class="auth-container">
    <BaseCard class="auth-card" padding="lg" radius="xl">
      <div class="auth-header">
        <h1>{{ t('auth.loginTitle') }}</h1>
        <p>{{ t('auth.loginSubtitle') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">{{ t('auth.email') }}</label>
          <BaseInput
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
          <BaseInput
            id="password"
            v-model="loginForm.password"
            type="password"
            :placeholder="t('auth.password')"
            required
            :disabled="isLoading"
          />
        </div>

        <BaseAlert v-if="error" variant="error">{{ error }}</BaseAlert>

        <BaseButton type="submit" variant="primary" block :disabled="isLoading">
          {{ isLoading ? t('auth.loggingIn') : t('auth.login') }}
        </BaseButton>
      </form>

      <!-- 分隔线 -->
      <div class="divider">
        <div class="divider-line"></div>
        <span class="divider-text">{{ t('auth.divider') }}</span>
        <div class="divider-line"></div>
      </div>

      <!-- Microsoft M365 登录按钮 -->
      <BaseButton
        type="button"
        @click="handleM365Login" 
        class="microsoft-button"
        variant="ghost"
        block
        :disabled="isLoading"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.46594 12.0484C5.46594 10.3451 6.44643 8.85314 8.00049 8.13696L8.0015 8.13696L8.00099 6.37151L8.00004 6.37151C8.00004 6.37151 5.46503 7.5621 5.46503 10.4702V12.0484Z" fill="#F25022"/>
          <path d="M10.7701 13.3344C10.7701 14.3936 10.2337 15.3269 9.35614 15.7796V17.5451C11.1009 16.8289 12.2534 15.0771 12.2534 13.015V11.4368C12.2534 10.3776 11.717 9.44424 10.8395 9.00502C11.7165 8.55228 12.2529 7.61895 12.2529 6.55973V4.98155C10.5082 5.70203 9.35566 7.44864 9.35566 9.50628C9.35566 10.5655 9.89848 11.4988 10.7701 11.9566V13.3344Z" fill="#7FBA00"/>
          <path d="M13.7623 13.3344C13.7623 14.3936 14.3046 15.3269 15.1827 15.7796V17.5451C13.4324 16.8289 12.2798 15.0771 12.2798 13.015V11.4368C12.2798 10.3776 12.8176 9.44424 13.6956 9.00502C12.8176 8.55228 12.2798 7.61895 12.2798 6.55973V4.98155C13.5418 5.49677 14.5417 6.46003 14.898 7.69024C15.7819 7.24233 16.3297 6.30491 16.3297 5.24194V3.01042H18.6677V5.24194C18.6677 7.94097 16.692 10.1975 13.7623 10.962V12.3343C13.7623 13.3344 13.7623 13.3344 13.7623 13.3344Z" fill="#00A4EF"/>
          <path d="M12.2788 13.015C12.2788 15.0771 13.4314 16.8289 15.1817 17.5451V15.7796C14.3036 15.3269 13.7613 14.3936 13.7613 13.3344V11.9566C14.6329 11.4988 15.1757 10.5655 15.1757 9.50628C15.1757 7.44864 14.0231 5.70203 12.2788 4.98155V6.55973C12.2788 7.61895 11.741 8.55228 10.8581 9.00502C11.7406 9.44424 12.2788 10.3776 12.2788 11.4368V13.015Z" fill="#FFB900"/>
        </svg>
        <span>{{ isLoading ? t('auth.m365Logging') : t('auth.m365') }}</span>
      </BaseButton>

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


    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseAlert from '@/components/base/BaseAlert.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
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
  display: flex;
  justify-content: center;
  padding: 3rem 1.5rem 4rem;
}

.auth-card {
  width: 100%;
  max-width: 440px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-ink);
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: var(--color-muted);
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
  color: var(--color-ink);
  font-size: 0.875rem;
}

/* 分隔线样式 */
.divider {
  display: flex;
  align-items: center;
  margin: 2rem 0;
  color: var(--color-subtle);
  font-size: 0.875rem;
}

.divider-line {
  flex: 1;
  height: 1px;
  background-color: var(--color-border);
}

.divider-text {
  padding: 0 1rem;
  font-weight: 500;
}

/* Microsoft登录按钮样式 */
.microsoft-button {
  gap: 0.75rem;
  font-weight: var(--font-weight-medium);
}

.auth-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.test-accounts {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: var(--color-surface-soft);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.test-accounts h4 {
  margin: 0 0 1rem 0;
  color: var(--color-ink);
  font-size: 0.875rem;
  font-weight: 600;
}

.test-account {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background-color: var(--color-surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  font-size: 0.9rem;
  color: var(--color-muted);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.1s;
}

.test-account:last-child {
  margin-bottom: 0;
}

.test-account strong {
  color: var(--color-ink);
  font-weight: 600;
}

.test-account:hover:not(:disabled) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
  transform: translateY(-1px);
}

.test-account:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-footer p {
  color: var(--color-muted);
  margin-bottom: 0.5rem;
}

.link-button {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.link-button:hover {
  color: var(--color-primary-strong);
}

@media (max-width: 640px) {
  .auth-container {
    padding: 1rem;
  }
}
</style>
