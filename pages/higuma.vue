<template>
  <SwipeNavigation leftRoute="fusinsha" rightRoute="jiko">
    <div>
    </div>
  </SwipeNavigation>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SwipeNavigation from '../components/SwipeNavigation.vue'

const startX = ref(0)
const threshold = 50
const router = useRouter()

function handleTouchStart(e: TouchEvent) {
  startX.value = e.touches[0].clientX
}

function handleTouchEnd(e: TouchEvent) {
  const diff = e.changedTouches[0].clientX - startX.value
  if (diff > threshold) {
    router.push({ name: 'jiko' })
  } else if (diff < -threshold) {
    router.push({ name: 'fuguai' })
  }
}
</script>
<style scoped></style>
