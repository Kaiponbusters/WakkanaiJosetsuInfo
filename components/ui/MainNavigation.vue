<template>
  <nav data-testid="main-navigation" class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- App Title / Logo -->
        <div class="flex items-center">
          <button data-testid="home-link" @click="navigateToHome"
            class="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            <span data-testid="app-title">稚内市除雪情報</span>
          </button>
        </div>

        <!-- Navigation Links -->
        <div class="flex items-center space-x-6">
          <!-- Josetsu Link -->
          <button data-testid="josetsu-link" @click="navigateToJosetsu"
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors">
            除雪情報
          </button>

          <!-- Notification Indicator -->
          <div class="relative">
            <button data-testid="notification-button" @click="navigateToNotifications" :class="[
              'p-2 rounded-full transition-colors',
              isNotificationEnabled && hasActiveSubscriptions
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-gray-400 hover:bg-gray-50'
            ]">
              <div data-testid="notification-indicator" :class="[
                'w-6 h-6 flex items-center justify-center',
                !isNotificationEnabled || !hasActiveSubscriptions ? 'inactive' : ''
              ]">
                <!-- Bell Icon -->
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>

              <!-- Notification Badge -->
              <span v-if="hasActiveSubscriptions" data-testid="notification-badge"
                class="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {{ subscriptionCount }}
              </span>

              <!-- Unread Count -->
              <span v-if="unreadCount > 0" data-testid="unread-count"
                class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                {{ unreadCount }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationManager } from '~/composables/notifications/useNotificationManager'
import { useNotificationHistoryService } from '~/composables/notifications/services/useNotificationHistoryService'

// Router
const router = useRouter()

// Services
const notificationManager = useNotificationManager()
const historyService = useNotificationHistoryService()

// State
const unreadCount = ref(0)

// Computed
const subscriptions = computed(() => notificationManager.getSubscriptions())
const isNotificationEnabled = computed(() => {
  const prefs = notificationManager.getPreferences()
  return prefs.enablePush || prefs.enableInApp
})

const hasActiveSubscriptions = computed(() => {
  return subscriptions.value.length > 0
})

const subscriptionCount = computed(() => {
  return subscriptions.value.length
})

// Methods
const navigateToHome = () => {
  router.push('/')
}

const navigateToJosetsu = () => {
  router.push('/josetsu')
}

const navigateToNotifications = () => {
  router.push('/notifications')
}

const loadUnreadCount = async () => {
  try {
    const stats = await historyService.getStats()
    unreadCount.value = stats.unread
  } catch (error) {
    console.error('Failed to load unread count:', error)
    unreadCount.value = 0
  }
}

// Lifecycle
onMounted(() => {
  loadUnreadCount()
})
</script>

<style scoped>
.inactive {
  opacity: 0.5;
}
</style>