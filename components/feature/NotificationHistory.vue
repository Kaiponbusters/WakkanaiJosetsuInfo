<template>
  <div class="notification-history">
    <div class="history-header">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">通知履歴</h2>
      <p class="text-gray-600 mb-6">過去に受信した除雪作業の通知を確認できます。</p>
    </div>

    <!-- Filters -->
    <div class="filters-section mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Area Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">エリア</label>
          <select
            v-model="filters.selectedArea"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="applyFilters"
          >
            <option value="">全てのエリア</option>
            <option v-for="area in availableAreas" :key="area" :value="area">
              {{ area }}
            </option>
          </select>
        </div>

        <!-- Type Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">種類</label>
          <select
            v-model="filters.selectedType"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="applyFilters"
          >
            <option value="">全ての種類</option>
            <option value="start">開始通知</option>
            <option value="end">完了通知</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">状態</label>
          <select
            v-model="filters.selectedStatus"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="applyFilters"
          >
            <option value="">全ての状態</option>
            <option value="unread">未読</option>
            <option value="read">既読</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="summary-section mb-6">
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span>総件数: <strong class="text-gray-900">{{ totalCount }}</strong></span>
          <span>表示中: <strong class="text-gray-900">{{ filteredNotifications.length }}</strong></span>
          <span v-if="filters.selectedArea">エリア: <strong class="text-gray-900">{{ filters.selectedArea }}</strong></span>
          <span v-if="filters.selectedType">種類: <strong class="text-gray-900">{{ getTypeLabel(filters.selectedType) }}</strong></span>
          <span v-if="filters.selectedStatus">状態: <strong class="text-gray-900">{{ getStatusLabel(filters.selectedStatus) }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="notifications-list">
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p class="text-gray-600">通知履歴を読み込み中...</p>
      </div>

      <div v-else-if="filteredNotifications.length === 0" class="text-center py-8">
        <div class="text-gray-400 mb-2">
          <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5-5-5h5v-12h5v12z" />
          </svg>
        </div>
        <p class="text-gray-600">通知履歴がありません</p>
      </div>

      <div v-else class="space-y-6">
        <div v-for="(notifications, date) in groupedNotifications" :key="date" class="date-group">
          <h3 class="text-lg font-semibold text-gray-800 mb-3 sticky top-0 bg-white py-2">
            {{ formatDate(date) }}
          </h3>
          
          <div class="space-y-3">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              :class="[
                'notification-item p-4 border rounded-lg transition-colors cursor-pointer',
                notification.read 
                  ? 'border-gray-200 bg-white hover:bg-gray-50' 
                  : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
              ]"
              @click="toggleRead(notification)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        notification.type === 'start' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      ]"
                    >
                      {{ getTypeLabel(notification.type) }}
                    </span>
                    <span class="text-sm font-medium text-gray-900">{{ notification.area }}</span>
                    <span v-if="!notification.read" class="w-2 h-2 bg-blue-600 rounded-full"></span>
                  </div>
                  
                  <p class="text-gray-700 mb-2">{{ notification.message }}</p>
                  
                  <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span>{{ formatTime(notification.timestamp) }}</span>
                    <span v-if="notification.metadata?.severity" 
                          :class="getSeverityClass(notification.metadata.severity)">
                      {{ getSeverityLabel(notification.metadata.severity) }}
                    </span>
                    <span v-if="notification.metadata?.estimatedDuration">
                      予想時間: {{ notification.metadata.estimatedDuration }}分
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 ml-4">
                  <button
                    @click.stop="toggleRead(notification)"
                    :class="[
                      'p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      notification.read ? 'text-gray-400' : 'text-blue-600'
                    ]"
                    :title="notification.read ? '未読にする' : '既読にする'"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            :d="notification.read ? 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' : 'M9 12l2 2 4-4'" />
                    </svg>
                  </button>
                  
                  <button
                    @click.stop="deleteNotification(notification.id)"
                    class="p-1 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="削除"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="text-center mt-6">
      <button
        @click="loadMore"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        さらに読み込む
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useNotificationHistoryService } from '~/composables/notifications/useNotificationHistoryService'
import type { NotificationHistoryItem, NotificationFilter } from '~/types/notification'
import { getTypeLabel, getSeverityLabel, getSeverityClass } from '~/utils/notificationHelpers'
import { WAKKANAI_AREAS } from '~/constants/areas'

// Services
const historyService = useNotificationHistoryService()

// Component state
const loading = ref(false)
const notifications = ref<NotificationHistoryItem[]>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = 20
const hasMore = ref(true)

// Filters
const filters = reactive({
  selectedArea: '',
  selectedType: '',
  selectedStatus: ''
})

// Available areas (imported from shared constants)
const availableAreas = ref([...WAKKANAI_AREAS])

// Computed
const filteredNotifications = computed(() => {
  let filtered = [...notifications.value]

  if (filters.selectedArea) {
    filtered = filtered.filter(n => n.area === filters.selectedArea)
  }

  if (filters.selectedType) {
    filtered = filtered.filter(n => n.type === filters.selectedType)
  }

  if (filters.selectedStatus) {
    filtered = filtered.filter(n => n.status === filters.selectedStatus)
  }

  return filtered
})

const groupedNotifications = computed(() => {
  const groups: Record<string, NotificationHistoryItem[]> = {}
  
  filteredNotifications.value.forEach(notification => {
    const date = new Date(notification.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(notification)
  })

  // Sort groups by date (newest first)
  const sortedGroups: Record<string, NotificationHistoryItem[]> = {}
  Object.keys(groups)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .forEach(date => {
      sortedGroups[date] = groups[date].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    })

  return sortedGroups
})

// Methods
const loadNotifications = async (reset = false) => {
  try {
    loading.value = true

    if (reset) {
      currentPage.value = 0
      notifications.value = []
    }

    const filter: NotificationFilter = {
      limit: pageSize,
      offset: currentPage.value * pageSize
    }

    const newNotifications = await historyService.getNotifications(filter)
    
    if (reset) {
      notifications.value = newNotifications
    } else {
      notifications.value.push(...newNotifications)
    }

    hasMore.value = newNotifications.length === pageSize
    
    // Get total count for summary
    const stats = await historyService.getStats()
    totalCount.value = stats.total

  } catch (error) {
    console.error('Failed to load notifications:', error)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  currentPage.value++
  await loadNotifications(false)
}

const applyFilters = async () => {
  await loadNotifications(true)
}

const toggleRead = async (notification: NotificationHistoryItem) => {
  try {
    if (notification.read) {
      // Mark as unread (this would need to be implemented in the service)
      notification.read = false
      notification.status = 'unread'
    } else {
      await historyService.markAsRead(notification.id)
      notification.read = true
      notification.status = 'read'
    }
  } catch (error) {
    console.error('Failed to toggle read status:', error)
  }
}

const deleteNotification = async (id: string) => {
  if (!confirm('この通知を削除しますか？')) {
    return
  }

  try {
    await historyService.deleteNotification(id)
    notifications.value = notifications.value.filter(n => n.id !== id)
    totalCount.value--
  } catch (error) {
    console.error('Failed to delete notification:', error)
  }
}

// Utility methods
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return '今日'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨日'
  } else {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }
}

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusLabel = (status: string): string => {
  return status === 'unread' ? '未読' : '既読'
}

// Lifecycle
onMounted(() => {
  loadNotifications(true)
})
</script>

<style scoped>
.notification-history {
  @apply max-w-4xl mx-auto p-6;
}

.notification-item {
  @apply transition-all duration-200;
}

.notification-item:hover {
  @apply shadow-sm;
}

.date-group {
  @apply relative;
}
</style>