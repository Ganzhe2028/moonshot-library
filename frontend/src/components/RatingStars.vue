<template>
  <div class="rating-stars">
    <div class="stars-container" role="radiogroup" :aria-label="ariaLabel">
      <button
        v-for="star in 5"
        :key="star"
        class="star"
        :class="{ 
          'filled': star <= modelValue, 
          'hovered': isInteractive && star <= hoverValue 
        }"
        type="button"
        role="radio"
        :aria-checked="star === modelValue"
        :aria-label="`${star} / 5`"
        :aria-disabled="!isInteractive || undefined"
        :disabled="!isInteractive"
        :tabindex="tabIndexForStar(star)"
        @click="handleClick(star)"
        @mouseenter="handleMouseEnter(star)"
        @mouseleave="handleMouseLeave"
        @keydown="handleKeyDown($event, star)"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      </button>
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
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  averageRating: 0,
  showAverage: false,
  interactive: true,
  ariaLabel: 'Rating'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'rating-change': [value: number]
}>()

const hoverValue = ref(0)
const isInteractive = computed(() => props.interactive)
const ariaLabel = computed(() => props.ariaLabel)

const tabIndexForStar = (star: number) => {
  if (!isInteractive.value) return -1
  if (props.modelValue > 0) {
    return star === props.modelValue ? 0 : -1
  }
  return star === 1 ? 0 : -1
}

const setRating = (value: number) => {
  emit('update:modelValue', value)
  emit('rating-change', value)
}

const handleClick = (star: number) => {
  if (!isInteractive.value) return
  setRating(star)
}

const handleKeyDown = (event: KeyboardEvent, star: number) => {
  if (!isInteractive.value) return

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp': {
      event.preventDefault()
      setRating(Math.min(5, star + 1))
      break
    }
    case 'ArrowLeft':
    case 'ArrowDown': {
      event.preventDefault()
      setRating(Math.max(1, star - 1))
      break
    }
    case 'Home': {
      event.preventDefault()
      setRating(1)
      break
    }
    case 'End': {
      event.preventDefault()
      setRating(5)
      break
    }
    case 'Enter':
    case ' ': {
      event.preventDefault()
      setRating(star)
      break
    }
    default:
      break
  }
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
  background: transparent;
  border: none;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  color: var(--color-border-strong);
  transition: all 0.2s ease;
  cursor: pointer;
}

.star:disabled {
  cursor: not-allowed;
}

.star:focus-visible {
  outline: 3px solid var(--color-primary-soft);
  outline-offset: 2px;
}

.star.filled {
  color: var(--color-warning-strong);
}

.star.hovered {
  color: var(--color-warning);
  transform: scale(1.1);
}

.star:hover:not(:disabled) {
  transform: scale(1.1);
}

.average-rating {
  font-size: var(--text-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
  margin-left: 8px;
}
</style>
