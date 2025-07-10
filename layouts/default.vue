<template>
  <div>
    <InformationIcon :type="iconType" />
    <!-- 下記slotはNuxtLayoutコンポーネントの子要素に差し替わる -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import InformationIcon from '~/components/ui/InformationIcon.vue'

const route = useRoute()

// ルートパスに基づいてアイコンタイプを決定
const iconType = computed(() => {
  if (route.path.includes('josetsu')) {
    return 'josetsu'
  }
  return 'default'
})
</script>

<style>
    html {
        font-family: "Helvetica Neue",
                    "Arial",
                    "Hiragino Kaku Gothic ProN",
                    "Hiragino Sans",
                    "Meiryo",
                    "sans-serif",
                    "Noto Sans JP";    }
</style>