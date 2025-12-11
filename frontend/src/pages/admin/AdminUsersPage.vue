<script setup lang="ts">
import { computed, onMounted, ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAdminStore } from '@/stores/admin'
import { userService } from '@/services/userService'
import { creditService } from '@/services/creditService'
import type { AuthUser } from '@/types/library'

const adminStore = useAdminStore()
const { t } = useI18n()

const roleFilter = ref<'all' | 'student' | 'teacher' | 'librarian' | 'admin'>('all')
const showEditDialog = ref(false)
const editingUser = reactive<Partial<AuthUser>>({})
const isSaving = ref(false)
const saveError = ref('')

const showCreditDialog = ref(false)
const creditLoading = ref(false)
const creditError = ref('')
const creditForm = reactive({
  score: 80,
  level: 'good' as 'excellent' | 'good' | 'warn' | 'suspended',
  status: 'active' as 'active' | 'restricted' | 'suspended',
  remarks: '',
})
const creditUserId = ref<string>('')

const scoreToLevel = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'warn'
  return 'suspended'
}

watch(
  () => creditForm.score,
  (score) => {
    if (Number.isFinite(score)) {
      creditForm.level = scoreToLevel(score)
    }
  },
)

const users = computed(() => {
  if (roleFilter.value === 'all') return adminStore.users
  return adminStore.users.filter((user) => user.role === roleFilter.value)
})

const membershipBadge = (status?: string) => {
  switch (status) {
    case 'active':
      return { text: t('admin.users.membershipActive'), className: 'green' }
    case 'suspended':
      return { text: t('admin.users.membershipSuspended'), className: 'red' }
    default:
      return { text: status || t('empty.noData'), className: 'gray' }
  }
}

const openEditDialog = (user: AuthUser) => {
  // 创建一个新的对象副本，而不是直接使用user对象
  const userCopy = { ...user }

  // 如果用户角色是admin，需要特殊处理，因为下拉框中没有admin选项
  // 我们可以将其角色设置为默认的librarian，或者保留原始角色但在UI中处理
  // 这里保留原始角色，但在显示时会处理不匹配的情况

  Object.assign(editingUser, userCopy)
  showEditDialog.value = true
  saveError.value = ''
}

const openCreditDialog = async (user: AuthUser) => {
  showCreditDialog.value = true
  creditError.value = ''
  creditLoading.value = true
  creditUserId.value = user.id
  try {
    const credit = await creditService.fetchCredit(user.id)
    creditForm.score = credit.score ?? 80
    creditForm.level = credit.level ?? 'good'
    creditForm.status = credit.status ?? 'active'
    creditForm.remarks = credit.remarks || ''
  } catch (error) {
    creditError.value =
      error instanceof Error ? error.message : (t('admin.users.creditError') as string)
  } finally {
    creditLoading.value = false
  }
}

const closeCreditDialog = () => {
  showCreditDialog.value = false
  creditError.value = ''
  creditUserId.value = ''
}

const saveCredit = async () => {
  if (!creditUserId.value) return
  creditLoading.value = true
  creditError.value = ''
  try {
    const updated = await creditService.updateCredit(creditUserId.value, {
      score: creditForm.score,
      level: creditForm.level,
      status: creditForm.status,
      remarks: creditForm.remarks || undefined,
    })
    creditForm.score = updated.score
    creditForm.level = updated.level
    creditForm.status = updated.status
    creditForm.remarks = updated.remarks || ''
    showCreditDialog.value = false
  } catch (error) {
    creditError.value =
      error instanceof Error ? error.message : (t('admin.users.creditError') as string)
  } finally {
    creditLoading.value = false
  }
}

const closeEditDialog = () => {
  showEditDialog.value = false
  Object.keys(editingUser).forEach(key => {
    delete (editingUser as Record<string, string | number | undefined>)[key]
  })
  saveError.value = ''
}

const validateForm = (): string | null => {
  // 获取当前登录用户信息（这里简化处理，实际应该从auth store获取）
  const currentUser = localStorage.getItem('user')
  let currentUserId = ''
  let currentUserRole = ''

  try {
    if (currentUser) {
      const parsed = JSON.parse(currentUser)
      currentUserId = parsed.id || ''
      currentUserRole = parsed.role || ''
    }
  } catch {
    // 忽略解析错误
  }

  // 防止管理员更改自己的角色（如果当前用户是管理员并且正在编辑自己）
  if (currentUserRole === 'admin' && currentUserId === editingUser.id &&
      editingUser.role && editingUser.role !== 'admin') {
    return t('admin.users.cannotChangeOwnRole') || '不能更改自己的角色'
  }

  // 确保角色和会员状态不为空
  if (!editingUser.role) {
    return t('admin.users.roleRequired') || '请选择用户角色'
  }

  if (!editingUser.membership) {
    return t('admin.users.membershipRequired') || '请选择会员状态'
  }

  // 学生角色需要年级信息
  if (editingUser.role === 'student' && !editingUser.grade) {
    return t('admin.users.gradeRequiredForStudent') || '学生角色需要填写年级信息'
  }

  // 验证年级格式（如果提供了年级）
  if (editingUser.grade && !/^[0-9]{1,2}$/.test(editingUser.grade)) {
    return t('admin.users.invalidGradeFormat') || '年级格式无效，请输入1-2位数字'
  }

  return null
}

const saveUserChanges = async () => {
  if (!editingUser.id) return

  // 表单验证
  const validationError = validateForm()
  if (validationError) {
    saveError.value = validationError
    return
  }

  isSaving.value = true
  saveError.value = ''
  try {
    // 准备更新参数，对于admin用户不更新角色
    const updateParams: any = {
      membership: editingUser.membership,
      grade: editingUser.grade
    }

    // 只有当用户不是admin时才更新角色
    if (editingUser.role !== 'admin') {
      updateParams.role = editingUser.role
    }

    const updatedUser = await userService.updateUser(editingUser.id, updateParams)

    // 更新本地用户列表
    const index = adminStore.users.findIndex(u => u.id === updatedUser.id)
    if (index !== -1) {
      adminStore.users[index] = updatedUser
    }

    closeEditDialog()
  } catch (error) {
      // 提供更友好的错误信息和回退文本
      if (error instanceof Error) {
        if (error.message.includes('权限') || error.message.includes('Permission')) {
          saveError.value = t('admin.users.permissionDenied') || '没有权限执行此操作'
        } else {
          saveError.value = error.message
        }
      } else {
        saveError.value = t('admin.users.updateFailed') || '更新用户信息失败'
      }
    } finally {
      isSaving.value = false
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
        <p class="eyebrow">{{ t('admin.users.title') }}</p>
        <h2>{{ t('admin.users.title') }}</h2>
      </div>
      <div class="actions">
        <select v-model="roleFilter">
          <option value="all">{{ t('admin.users.filterAll') }}</option>
          <option value="student">{{ t('auth.student') }}</option>
          <option value="teacher">{{ t('auth.teacher') }}</option>
          <option value="librarian">{{ t('auth.librarian') }}</option>
          <option value="admin">Admin</option>
        </select>
        <button type="button" class="ghost" @click="reload">{{ t('admin.users.refresh') }}</button>
      </div>
    </div>

    <div v-if="adminStore.usersLoading" class="hint">{{ t('admin.users.loading') }}</div>
    <p v-else-if="adminStore.usersError" class="alert error">{{ adminStore.usersError }}</p>
    <div v-else class="table">
      <div class="table-head">
        <span>{{ t('auth.name') }} / {{ t('auth.email') }}</span>
        <span>{{ t('auth.role') }}</span>
        <span>{{ t('admin.users.membership') }}</span>
        <span>{{ t('auth.grade') }}</span>
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
        <button type="button" class="ghost small" @click="openEditDialog(user)">
          {{ t('admin.edit') }}
        </button>
        <button type="button" class="ghost small" @click="openCreditDialog(user)">
          {{ t('admin.users.editCredit') }}
        </button>
      </div>
      <p v-if="!users.length" class="hint">{{ t('empty.noData') }}</p>
    </div>
  </section>

  <!-- 编辑用户对话框 -->
  <div v-if="showEditDialog" class="modal-overlay" @click.self="closeEditDialog">
    <div class="dialog">
      <div class="dialog-header">
        <h3>{{ t('admin.editUser') }}: {{ editingUser.name }}</h3>
        <button type="button" class="close-button" @click="closeEditDialog">×</button>
      </div>

      <div class="dialog-content">
        <div v-if="saveError" class="alert error">{{ saveError }}</div>

        <div class="form-group">
          <label>{{ t('auth.role') }}</label>
          <!-- 为admin用户显示特殊选项，但不允许修改 -->
          <div v-if="editingUser.role === 'admin'" class="form-group-readonly">
            <span class="role-display">{{ t('auth.role') }}: Admin</span>
            <small class="readonly-hint">{{ t('admin.users.cannotEditAdminRole') || '管理员角色不能被修改' }}</small>
          </div>
          <select v-else v-model="editingUser.role" :disabled="isSaving">
            <option value="student">{{ t('auth.student') }}</option>
            <option value="teacher">{{ t('auth.teacher') }}</option>
            <option value="librarian">{{ t('auth.librarian') }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('admin.users.membership') }}</label>
          <select v-model="editingUser.membership" :disabled="isSaving">
            <option value="active">{{ t('admin.users.membershipActive') }}</option>
            <option value="suspended">{{ t('admin.users.membershipSuspended') }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('auth.grade') }}</label>
          <input
            type="text"
            v-model="editingUser.grade"
            :disabled="isSaving"
            placeholder="{{ t('admin.users.gradePlaceholder') || '如：1-12' }}"
          />
        </div>
      </div>

      <div class="dialog-actions">
        <button type="button" class="ghost" @click="closeEditDialog" :disabled="isSaving">
          {{ t('admin.cancel') }}
        </button>
        <button type="button" @click="saveUserChanges" :disabled="isSaving">
          {{ isSaving ? t('admin.saving') : t('admin.save') }}
        </button>
      </div>
    </div>
  </div>

  <!-- 信用对话框 -->
  <div v-if="showCreditDialog" class="modal-overlay" @click.self="closeCreditDialog">
    <div class="dialog">
      <div class="dialog-header">
        <h3>{{ t('admin.users.editCredit') }}</h3>
        <button type="button" class="close-button" @click="closeCreditDialog">×</button>
      </div>
      <div class="dialog-content">
        <div v-if="creditError" class="alert error">{{ creditError }}</div>
        <div v-else-if="creditLoading" class="hint">{{ t('admin.users.loadingCredit') }}</div>
        <template v-else>
          <div class="form-group">
            <label>{{ t('admin.users.creditScore') }}</label>
            <input
              type="number"
              min="0"
              max="1000"
              v-model.number="creditForm.score"
              :disabled="creditLoading"
            />
            <small class="readonly-hint">{{ t('admin.users.creditLevel') }}: {{ creditForm.level }}</small>
          </div>
          <div class="form-group">
            <label>{{ t('admin.users.creditLevel') }}</label>
            <div class="form-group-readonly">
              <span class="role-display">{{ t('admin.users.creditLevel') }}: {{ creditForm.level }}</span>
              <small class="readonly-hint">{{ t('admin.users.creditStatus') }}: {{ creditForm.status }}</small>
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('admin.users.creditRemarks') }}</label>
            <textarea v-model="creditForm.remarks" rows="3" :disabled="creditLoading"></textarea>
          </div>
        </template>
      </div>
      <div class="dialog-actions">
        <button type="button" class="ghost" @click="closeCreditDialog" :disabled="creditLoading">
          {{ t('admin.cancel') }}
        </button>
        <button type="button" @click="saveCredit" :disabled="creditLoading || !!creditError">
          {{ creditLoading ? t('admin.saving') : t('admin.users.creditSave') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
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
  font-size: var(--text-xs);
  color: var(--color-subtle);
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
  cursor: pointer;
  transition: all 0.2s;
}

.ghost:hover {
  background: rgba(15, 17, 21, 0.08);
}

.ghost.small {
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
}

.table {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
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
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(15, 17, 21, 0.05);
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #6c6f78;
  padding: 0.2rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-button:hover {
  background: rgba(15, 17, 21, 0.05);
  color: #1f1f25;
}

.dialog-content {
  padding: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group select,
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  background: var(--color-surface);
}

.form-group-readonly {
  padding: 0.7rem;
  background-color: var(--color-surface-soft);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.role-display {
  font-weight: 500;
  display: block;
}

.readonly-hint {
  color: var(--color-subtle);
  font-size: var(--text-xs);
  display: block;
  margin-top: 0.25rem;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
}

.dialog-actions button {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dialog-actions button:not(.ghost) {
  background: var(--cta-gradient);
  color: white;
  border: none;
  box-shadow: 0 12px 24px var(--color-primary-soft);
}

.dialog-actions button:not(.ghost):hover:not(:disabled) {
  filter: brightness(0.96);
}
</style>
