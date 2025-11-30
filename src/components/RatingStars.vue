<template>
  <div class="rating-stars">
    <div class="stars-container">
      <div 
        v-for="star in 5" 
        :key="star"
        class="star"
        :class="{ 
          'filled': star <= modelValue, 
          'hovered': isInteractive && star <= hoverValue 
        }"
        @click="handleClick(star)"
        @mouseenter="handleMouseEnter(star)"
        @mouseleave="handleMouseLeave"
        :style="{ cursor: isInteractive ? 'pointer' : 'default' }"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      </div>
    </div>
    <div v-if="showAverage && averageRating" class="average-rating">
      {{ averageRating.toFixed(1) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue?: number
  averageRating?: number
  showAverage?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  averageRating: 0,
  showAverage: false,
  interactive: true
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'rating-change': [value: number]
}>()

const hoverValue = ref(0)
const isInteractive = computed(() => props.interactive)

const handleClick = (star: number) => {
  if (!isInteractive.value) return
  emit('update:modelValue', star)
  emit('rating-change', star)
}

const handleMouseEnter = (star: number) => {
  if (!isInteractive.value) return
  hoverValue.value = star
}

const handleMouseLeave = () => {
  hoverValue.value = 0
}
</script>

<style scoped>
.rating-stars {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars-container {
  display: flex;
  gap: 4px;
}

.star {
  color: #e0e0e0;
  transition: all 0.2s ease;
}

.star.filled {
  color: #ffb400;
}

.star.hovered {
  color: #ffb400;
  transform: scale(1.1);
}

.star:hover {
  transform: scale(1.1);
}

.average-rating {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin-left: 8px;
}
</style>