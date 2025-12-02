<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>{{ t('auth.registerTitle') }}</h1>
        <p>{{ t('auth.registerSubtitle') }}</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="name">{{ t('auth.name') }}</label>
          <input
            id="name"
            v-model="registerForm.name"
            type="text"
            :placeholder="t('auth.name')"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="email">{{ t('auth.email') }}</label>
          <input
            id="email"
            v-model="registerForm.email"
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
            v-model="registerForm.password"
            type="password"
            :placeholder="t('auth.password')"
            required
            minlength="6"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="role">{{ t('auth.role') }}</label>
          <select
            id="role"
            v-model="registerForm.role"
            required
            :disabled="isLoading"
          >
            <option value="">{{ t('auth.selectRole') }}</option>
            <option value="student">{{ t('auth.student') }}</option>
            <option value="teacher">{{ t('auth.teacher') }}</option>
            <option value="librarian">{{ t('auth.librarian') }}</option>
          </select>
        </div>

        <div class="form-group" v-if="registerForm.role === 'student'">
          <label for="grade">{{ t('auth.grade') }}</label>
          <input
            id="grade"
            v-model="registerForm.grade"
            type="text"
            :placeholder="t('auth.gradePlaceholder')"
            :disabled="isLoading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="submit-button" :disabled="isLoading">
          {{ isLoading ? t('auth.registering') : t('auth.register') }}
        </button>
      </form>

      <div class="auth-footer">
        <p>{{ t('auth.hasAccount') }}</p>
        <router-link to="/login" class="link-button">{{ t('auth.loginNow') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import type { RegisterRequest } from '@/types/library'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const registerForm = reactive<RegisterRequest>({
  name: '',
  email: '',
  password: '',
  role: 'student',
  grade: ''
})

const isLoading = ref(false)
const error = ref('')

const handleRegister = async () => {
  isLoading.value = true
  error.value = ''

  try {
    // 清理表单数据
    const submitData = {
      ...registerForm,
      grade: registerForm.grade?.trim() || undefined
    }

    const success = await authStore.register(submitData)
    
    if (success) {
      // 注册成功，跳转到首页
      router.push('/')
    } else {
      error.value = authStore.error || '注册失败'
    }
  } catch (err) {
    error.value = '注册过程中发生错误'
    console.error('Register error:', err)
  } finally {
    isLoading.value = false
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

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
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

@media (max-width: 640px) {
  .auth-container {
    padding: 1rem;
  }
  
  .auth-card {
    padding: 2rem;
  }
}
</style>
