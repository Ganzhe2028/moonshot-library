<template>
  <div class="auth-callback-container">
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  text-align: center;
  color: #6366f1;
  font-size: 1rem;
}

.loading-spinner p {
  margin: 0;
}
</style>

