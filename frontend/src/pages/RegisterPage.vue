<template>
  <div class="auth-container">
    <BaseCard class="auth-card" padding="lg" radius="xl">
      <div class="auth-header">
        <h1>{{ t('auth.registerTitle') }}</h1>
        <p>{{ t('auth.registerSubtitle') }}</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="name">{{ t('auth.name') }}</label>
          <BaseInput
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
          <BaseInput
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
          <BaseInput
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
          <BaseInput
            id="grade"
            v-model="registerForm.grade"
            type="text"
            :placeholder="t('auth.gradePlaceholder')"
            :disabled="isLoading"
          />
        </div>

        <BaseAlert v-if="error" variant="error">{{ error }}</BaseAlert>

        <BaseButton type="submit" variant="primary" block :disabled="isLoading">
          {{ isLoading ? t('auth.registering') : t('auth.register') }}
        </BaseButton>
      </form>

      <div class="auth-footer">
        <p>{{ t('auth.hasAccount') }}</p>
        <router-link to="/login" class="link-button">{{ t('auth.loginNow') }}</router-link>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseAlert from '@/components/base/BaseAlert.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
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

.form-group select {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: var(--text-base);
  background: var(--color-surface-soft);
  color: var(--color-ink);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.form-group select:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
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
