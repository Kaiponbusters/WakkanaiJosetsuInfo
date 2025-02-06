<template>
  <div class="swipe-area" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  leftRoute: string,
  rightRoute: string
}>()

const startX = ref(0)
const threshold = 50
const router = useRouter()

function handleTouchStart(e: TouchEvent) {
  startX.value = e.touches[0].clientX
}

function handleTouchEnd(e: TouchEvent) {
  const diff = e.changedTouches[0].clientX - startX.value
  if (diff > threshold) {
    // 右スワイプ
    router.push('/' + props.leftRoute)
  } else if (diff < -threshold) {
    // 左スワイプ
    router.push('/' + props.rightRoute)
  }
}
</script>

<style scoped>
.swipe-area {
  width: 100%;
  height: 100%;
  touch-action: pan-x;
}
</style>
