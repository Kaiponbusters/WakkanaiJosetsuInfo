<template>
  <div class="notification-settings">
    <div class="settings-header">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">通知設定</h2>
      <p class="text-gray-600 mb-6">除雪作業の通知を受け取るエリアと設定を管理できます。</p>
    </div>

    <!-- Notification Toggle -->
    <div class="settings-section mb-8">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">通知の有効/無効</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label class="text-sm font-medium text-gray-700">プッシュ通知</label>
            <p class="text-xs text-gray-500">ブラウザの通知機能を使用します</p>
          </div>
          <button
            @click="togglePushNotifications"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              preferences.enablePush ? 'bg-blue-600' : 'bg-gray-200'
            ]"
            :disabled="!browserSupportsNotifications"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                preferences.enablePush ? 'translate-x-6' : 'translate-x-1'
              ]"
            />
          </button>
        </div>

        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label class="text-sm font-medium text-gray-700">アプリ内通知</label>
            <p class="text-xs text-gray-500">アプリ使用中にトースト通知を表示します</p>
          </div>
          <button
            @click="toggleInAppNotifications"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              preferences.enableInApp ? 'bg-blue-600' : 'bg-gray-200'
            ]"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                preferences.enableInApp ? 'translate-x-6' : 'translate-x-1'
              ]"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Area Subscriptions -->
    <div class="settings-section mb-8">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">購読エリア</h3>
      
      <!-- Area Search -->
      <div class="mb-4">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="エリアを検索..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @input="onSearchInput"
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Search Results -->
        <div v-if="showSearchResults && filteredAreas.length > 0" class="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <button
            v-for="area in filteredAreas"
            :key="area"
            @click="addSubscription(area)"
            class="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            :disabled="isSubscribed(area)"
          >
            <span :class="isSubscribed(area) ? 'text-gray-400' : 'text-gray-900'">
              {{ area }}
            </span>
            <span v-if="isSubscribed(area)" class="ml-2 text-xs text-gray-500">(購読済み)</span>
          </button>
        </div>
      </div>

      <!-- Current Subscriptions -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-gray-700 mb-2">現在の購読エリア ({{ subscriptions.length }})</h4>
        <div v-if="subscriptions.length === 0" class="text-gray-500 text-sm py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          まだエリアを購読していません
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="area in subscriptions"
            :key="area"
            class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <span class="text-gray-900 font-medium">{{ area }}</span>
            <button
              @click="removeSubscription(area)"
              class="text-red-600 hover:text-red-800 focus:outline-none"
              :aria-label="`${area}の購読を解除`"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="settings-section mb-8">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">通知統計</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gray-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-600">{{ stats.total }}</div>
          <div class="text-sm text-gray-600">総通知数</div>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-600">{{ stats.unread }}</div>
          <div class="text-sm text-gray-600">未読通知</div>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-600">{{ stats.byType.start }}</div>
          <div class="text-sm text-gray-600">開始通知</div>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-600">{{ stats.byType.end }}</div>
          <div class="text-sm text-gray-600">完了通知</div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="settings-actions flex flex-col sm:flex-row gap-4">
      <button
        @click="clearAllNotifications"
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        :disabled="stats.total === 0"
      >
        全ての通知を削除
      </button>
      <button
        @click="markAllAsRead"
        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        :disabled="stats.unread === 0"
      >
        全て既読にする
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">設定を保存中...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useNotificationManager } from '~/composables/notifications/useNotificationManager'
import { useNotificationHistoryService } from '~/composables/notifications/useNotificationHistoryService'

// Available areas (this would typically come from an API or store)
const availableAreas = ref([
  '中央区', '港区', '朝日区', '富岡区', '宗谷区', '恵北区',
  '声問区', '増幌区', '沼川区', '豊富区', '猿払区', '浜頓別区'
])

// Component state
const searchQuery = ref('')
const showSearchResults = ref(false)
const loading = ref(false)

// Services
const notificationManager = useNotificationManager()
const historyService = useNotificationHistoryService()

// Reactive data
const preferences = ref({
  enablePush: false,
  enableInApp: true
})

const subscriptions = ref<string[]>([])
const stats = ref({
  total: 0,
  unread: 0,
  byArea: {} as Record<string, number>,
  byType: { start: 0, end: 0 }
})

// Computed
const browserSupportsNotifications = computed(() => {
  return 'Notification' in window
})

const filteredAreas = computed(() => {
  if (!searchQuery.value) return []
  
  return availableAreas.value.filter(area =>
    area.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
    !subscriptions.value.includes(area)
  )
})

// Methods
const initialize = async () => {
  try {
    loading.value = true
    
    // Initialize notification manager
    await notificationManager.initialize()
    
    // Load current preferences and subscriptions
    const currentPrefs = notificationManager.getPreferences()
    preferences.value = {
      enablePush: currentPrefs.enablePush,
      enableInApp: currentPrefs.enableInApp
    }
    
    subscriptions.value = notificationManager.getSubscriptions()
    
    // Load statistics
    await loadStats()
    
  } catch (error) {
    console.error('Failed to initialize notification settings:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    stats.value = await historyService.getStats()
  } catch (error) {
    console.error('Failed to load notification stats:', error)
  }
}

const togglePushNotifications = async () => {
  try {
    loading.value = true
    
    if (!preferences.value.enablePush) {
      const enabled = await notificationManager.enableNotifications()
      preferences.value.enablePush = enabled
    } else {
      await notificationManager.disableNotifications()
      preferences.value.enablePush = false
      preferences.value.enableInApp = false
    }
  } catch (error) {
    console.error('Failed to toggle push notifications:', error)
  } finally {
    loading.value = false
  }
}

const toggleInAppNotifications = async () => {
  try {
    preferences.value.enableInApp = !preferences.value.enableInApp
    
    // Note: In-app notification preference is handled locally
    // The actual saving would be handled by the notification manager internally
    console.log('In-app notifications toggled:', preferences.value.enableInApp)
  } catch (error) {
    console.error('Failed to toggle in-app notifications:', error)
  }
}

const onSearchInput = () => {
  showSearchResults.value = searchQuery.value.length > 0
}

const addSubscription = async (area: string) => {
  try {
    await notificationManager.subscribe(area)
    subscriptions.value = notificationManager.getSubscriptions()
    searchQuery.value = ''
    showSearchResults.value = false
  } catch (error) {
    console.error(`Failed to subscribe to ${area}:`, error)
  }
}

const removeSubscription = async (area: string) => {
  try {
    await notificationManager.unsubscribe(area)
    subscriptions.value = notificationManager.getSubscriptions()
  } catch (error) {
    console.error(`Failed to unsubscribe from ${area}:`, error)
  }
}

const isSubscribed = (area: string): boolean => {
  return subscriptions.value.includes(area)
}

const clearAllNotifications = async () => {
  if (!confirm('全ての通知履歴を削除しますか？この操作は取り消せません。')) {
    return
  }
  
  try {
    loading.value = true
    await historyService.clearHistory()
    await loadStats()
  } catch (error) {
    console.error('Failed to clear notifications:', error)
  } finally {
    loading.value = false
  }
}

const markAllAsRead = async () => {
  try {
    loading.value = true
    await historyService.markAllAsRead()
    await loadStats()
  } catch (error) {
    console.error('Failed to mark all as read:', error)
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => searchQuery.value, (newValue) => {
  if (newValue.length === 0) {
    showSearchResults.value = false
  }
})

// Lifecycle
onMounted(() => {
  initialize()
})

// Close search results when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showSearchResults.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-settings {
  @apply max-w-4xl mx-auto p-6;
}

.settings-section {
  @apply border-b border-gray-200 pb-6;
}

.settings-section:last-child {
  @apply border-b-0 pb-0;
}
</style>