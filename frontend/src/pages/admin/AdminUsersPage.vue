<script setup lang="ts">
import { computed, onMounted, ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseAlert from '@/components/base/BaseAlert.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
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
      return { text: t('admin.users.membershipActive'), variant: 'success' as const }
    case 'suspended':
      return { text: t('admin.users.membershipSuspended'), variant: 'error' as const }
    default:
      return { text: status || t('empty.noData'), variant: 'neutral' as const }
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
    const updateParams: Partial<AuthUser> = {
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
  <BaseCard padding="sm" radius="lg" shadow="none">
    <div class="panel-head u-split u-wrap">
      <div>
        <p class="eyebrow">{{ t('admin.users.title') }}</p>
        <h2>{{ t('admin.users.title') }}</h2>
      </div>
      <div class="actions u-inline u-inline-sm">
        <select v-model="roleFilter">
          <option value="all">{{ t('admin.users.filterAll') }}</option>
          <option value="student">{{ t('auth.student') }}</option>
          <option value="teacher">{{ t('auth.teacher') }}</option>
          <option value="librarian">{{ t('auth.librarian') }}</option>
          <option value="admin">Admin</option>
        </select>
        <BaseButton type="button" variant="ghost" size="sm" @click="reload">
          {{ t('admin.users.refresh') }}
        </BaseButton>
      </div>
    </div>

    <div v-if="adminStore.usersLoading" class="hint">{{ t('admin.users.loading') }}</div>
    <BaseAlert v-else-if="adminStore.usersError" variant="error">
      {{ adminStore.usersError }}
    </BaseAlert>
    <div v-else class="table u-stack-sm">
      <div class="table-head u-grid">
        <span>{{ t('auth.name') }} / {{ t('auth.email') }}</span>
        <span>{{ t('auth.role') }}</span>
        <span>{{ t('admin.users.membership') }}</span>
        <span>{{ t('auth.grade') }}</span>
      </div>
      <div v-for="user in users" :key="user.id" class="table-row u-grid">
        <div>
          <p class="title">{{ user.name }}</p>
          <p class="meta">{{ user.email }}</p>
        </div>
        <BaseBadge variant="neutral" size="sm">{{ user.role }}</BaseBadge>
        <BaseBadge :variant="membershipBadge(user.membership).variant" size="sm">
          {{ membershipBadge(user.membership).text }}
        </BaseBadge>
        <span>{{ user.grade || '--' }}</span>
        <div class="row-actions u-inline u-inline-sm">
          <BaseButton type="button" variant="ghost" size="sm" @click="openEditDialog(user)">
            {{ t('admin.edit') }}
          </BaseButton>
          <BaseButton type="button" variant="ghost" size="sm" @click="openCreditDialog(user)">
            {{ t('admin.users.editCredit') }}
          </BaseButton>
        </div>
      </div>
      <p v-if="!users.length" class="hint">{{ t('empty.noData') }}</p>
    </div>
  </BaseCard>

  <!-- 编辑用户对话框 -->
  <BaseModal
    :open="showEditDialog"
    :title="`${t('admin.editUser')}: ${editingUser.name || ''}`"
    @close="closeEditDialog"
  >
    <BaseAlert v-if="saveError" variant="error">{{ saveError }}</BaseAlert>

    <div class="form-group u-stack">
      <label>{{ t('auth.role') }}</label>
      <div v-if="editingUser.role === 'admin'" class="form-group-readonly">
        <span class="role-display">{{ t('auth.role') }}: Admin</span>
        <small class="readonly-hint">{{
          t('admin.users.cannotEditAdminRole') || '管理员角色不能被修改'
        }}</small>
      </div>
      <select v-else v-model="editingUser.role" :disabled="isSaving">
        <option value="student">{{ t('auth.student') }}</option>
        <option value="teacher">{{ t('auth.teacher') }}</option>
        <option value="librarian">{{ t('auth.librarian') }}</option>
      </select>
    </div>

    <div class="form-group u-stack">
      <label>{{ t('admin.users.membership') }}</label>
      <select v-model="editingUser.membership" :disabled="isSaving">
        <option value="active">{{ t('admin.users.membershipActive') }}</option>
        <option value="suspended">{{ t('admin.users.membershipSuspended') }}</option>
      </select>
    </div>

    <div class="form-group u-stack">
      <label>{{ t('auth.grade') }}</label>
      <BaseInput
        type="text"
        v-model="editingUser.grade"
        :disabled="isSaving"
        :placeholder="t('admin.users.gradePlaceholder') || '如：1-12'"
      />
    </div>

    <template #footer>
      <BaseButton type="button" variant="secondary" :disabled="isSaving" @click="closeEditDialog">
        {{ t('admin.cancel') }}
      </BaseButton>
      <BaseButton type="button" variant="primary" :disabled="isSaving" @click="saveUserChanges">
        {{ isSaving ? t('admin.saving') : t('admin.save') }}
      </BaseButton>
    </template>
  </BaseModal>

  <!-- 信用对话框 -->
  <BaseModal :open="showCreditDialog" :title="t('admin.users.editCredit')" @close="closeCreditDialog">
    <BaseAlert v-if="creditError" variant="error">{{ creditError }}</BaseAlert>
    <div v-else-if="creditLoading" class="hint">{{ t('admin.users.loadingCredit') }}</div>
    <template v-else>
      <div class="form-group u-stack">
        <label>{{ t('admin.users.creditScore') }}</label>
        <BaseInput
          type="number"
          min="0"
          max="1000"
          v-model.number="creditForm.score"
          :disabled="creditLoading"
        />
        <small class="readonly-hint">{{ t('admin.users.creditLevel') }}: {{ creditForm.level }}</small>
      </div>
      <div class="form-group u-stack">
        <label>{{ t('admin.users.creditLevel') }}</label>
        <div class="form-group-readonly">
          <span class="role-display">{{ t('admin.users.creditLevel') }}: {{ creditForm.level }}</span>
          <small class="readonly-hint">{{ t('admin.users.creditStatus') }}: {{ creditForm.status }}</small>
        </div>
      </div>
      <div class="form-group u-stack">
        <label>{{ t('admin.users.creditRemarks') }}</label>
        <textarea v-model="creditForm.remarks" rows="3" :disabled="creditLoading"></textarea>
      </div>
    </template>

    <template #footer>
      <BaseButton type="button" variant="secondary" :disabled="creditLoading" @click="closeCreditDialog">
        {{ t('admin.cancel') }}
      </BaseButton>
      <BaseButton type="button" variant="primary" :disabled="creditLoading || !!creditError" @click="saveCredit">
        {{ creditLoading ? t('admin.saving') : t('admin.users.creditSave') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.panel-head {
  margin-bottom: 0.5rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: var(--text-xs);
  color: var(--color-subtle);
  margin: 0 0 0.25rem;
}

.panel-head h2 {
  margin: 0;
}

.actions {
}

.row-actions {
  justify-content: flex-end;
}

select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  padding: 0.5rem;
  background: var(--color-surface-soft);
  color: var(--color-ink);
}

.table {
  gap: var(--space-2);
}

.table-head,
.table-row {
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: var(--space-3);
  align-items: center;
}

.table-head {
  font-weight: 600;
  color: var(--color-muted);
}

.table-row {
  padding: 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.title {
  margin: 0;
  font-weight: 600;
}

.meta {
  margin: 0.1rem 0 0;
  color: var(--color-subtle);
  font-size: var(--text-sm);
}

.hint {
  color: var(--color-subtle);
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .table-head,
  .table-row {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

/* 模态框样式 */
.form-group {
  margin-bottom: 1rem;
  gap: var(--space-2);
}

.form-group label {
  font-weight: 500;
  color: var(--color-ink);
}

.form-group select,
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
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
