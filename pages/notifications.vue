<template>
  <div class="notifications-page">
    <div class="container mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">通知管理</h1>
        <p class="text-gray-600">除雪作業の通知設定と履歴を管理できます。</p>
      </div>

      <!-- Tab Navigation -->
      <div class="mb-8">
        <nav class="flex space-x-8" aria-label="Tabs">
          <button
            @click="activeTab = 'settings'"
            :class="[
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            通知設定
          </button>
          <button
            @click="activeTab = 'history'"
            :class="[
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            通知履歴
            <span v-if="unreadCount > 0" class="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {{ unreadCount }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="settings-tab">
          <NotificationSettings @stats-updated="handleStatsUpdate" />
        </div>

        <!-- History Tab -->
        <div v-if="activeTab === 'history'" class="history-tab">
          <NotificationHistory />
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <NotificationToast
      ref="toastRef"
      @toast-click="handleToastClick"
      @toast-dismiss="handleToastDismiss"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import NotificationSettings from '~/components/feature/NotificationSettings.vue'
import NotificationHistory from '~/components/feature/NotificationHistory.vue'
import NotificationToast from '~/components/feature/NotificationToast.vue'
import { useNotificationHistoryService } from '~/composables/notifications/useNotificationHistoryService'
import type { NotificationStats } from '~/types/notification'
// useHead is auto-imported by Nuxt

// Meta
useHead({
  title: '通知管理 - 稚内市除雪情報システム',
  meta: [
    {
      name: 'description',
      content: '稚内市の除雪作業通知の設定と履歴を管理できます。'
    }
  ]
})

// Component state
const activeTab = ref<'settings' | 'history'>('settings')
const unreadCount = ref(0)
const toastRef = ref()

// Services
const historyService = useNotificationHistoryService()

// Methods
const handleStatsUpdate = (stats: NotificationStats) => {
  unreadCount.value = stats.unread
}

const handleToastClick = (toast: any) => {
  // Navigate to history tab and potentially filter by the toast's area
  activeTab.value = 'history'
  console.log('Toast clicked:', toast)
}

const handleToastDismiss = (id: string) => {
  console.log('Toast dismissed:', id)
}

const loadInitialStats = async () => {
  try {
    const stats = await historyService.getStats()
    unreadCount.value = stats.unread
  } catch (error) {
    console.error('Failed to load initial stats:', error)
  }
}

// Demo function to test toast notifications
const showDemoNotification = () => {
  if (toastRef.value) {
    toastRef.value.addToast({
      area: '中央区',
      type: 'start',
      message: '除雪作業が開始されました: 中央区',
      read: false,
      metadata: {
        severity: 'medium',
        estimatedDuration: 30
      }
    })
  }
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Alt + 1 for settings, Alt + 2 for history
  if (event.altKey) {
    if (event.key === '1') {
      activeTab.value = 'settings'
      event.preventDefault()
    } else if (event.key === '2') {
      activeTab.value = 'history'
      event.preventDefault()
    }
  }
}

// Lifecycle
onMounted(() => {
  loadInitialStats()
  document.addEventListener('keydown', handleKeydown)
  
  // Check for URL hash to set initial tab
  if (process.client) {
    const hash = window.location.hash
    if (hash === '#history') {
      activeTab.value = 'history'
    } else if (hash === '#settings') {
      activeTab.value = 'settings'
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for tab changes to update URL hash
watch(() => activeTab.value, (newTab) => {
  if (process.client) {
    window.location.hash = newTab
  }
})

// Expose demo function for development
if (process.dev) {
  ;(window as any).showDemoNotification = showDemoNotification
}
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background-color: #f9fafb;
}

.tab-content {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

/* Smooth transitions for tab switching */
.settings-tab,
.history-tab {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>