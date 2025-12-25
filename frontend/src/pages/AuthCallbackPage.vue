<template>
  <div class="auth-callback-container u-center">
    <div class="loading-spinner">
      <p>正在处理登录...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 这个组件只是一个占位符
// 实际的登录处理逻辑在 App.vue 的 onMounted 钩子中
</script>

<style scoped>
.auth-callback-container {
  min-height: 100vh;
}

.loading-spinner {
  text-align: center;
  color: var(--color-primary);
  font-size: var(--text-base);
}

.loading-spinner p {
  margin: 0;
}
</style>
