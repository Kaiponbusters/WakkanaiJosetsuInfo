<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup
        name="toast"
        tag="div"
        class="fixed top-4 right-4 z-50 space-y-2"
      >
        <div
          v-for="toast in visibleToasts"
          :key="toast.id"
          :class="[
            'toast-item max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
            getToastClass(toast.type)
          ]"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <component :is="getIcon(toast.type)" :class="getIconClass(toast.type)" />
              </div>
              
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <div class="flex items-center justify-between mb-1">
                  <p class="text-sm font-medium text-gray-900">
                    {{ toast.area }}
                  </p>
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      toast.type === 'start' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    ]"
                  >
                    {{ getTypeLabel(toast.type) }}
                  </span>
                </div>
                
                <p class="text-sm text-gray-500">
                  {{ toast.message }}
                </p>
                
                <div v-if="toast.metadata" class="mt-2 text-xs text-gray-400">
                  <span v-if="toast.metadata.estimatedDuration">
                    予想時間: {{ toast.metadata.estimatedDuration }}分
                  </span>
                  <span v-if="toast.metadata.severity" 
                        :class="getSeverityClass(toast.metadata.severity)"
                        class="ml-2">
                    {{ getSeverityLabel(toast.metadata.severity) }}
                  </span>
                </div>

                <!-- Actions -->
                <div class="mt-3 flex space-x-2">
                  <button
                    @click="viewDetails(toast)"
                    class="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    詳細を見る
                  </button>
                  <button
                    @click="dismissToast(toast.id)"
                    class="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    閉じる
                  </button>
                </div>
              </div>

              <div class="ml-4 flex-shrink-0 flex">
                <button
                  @click="dismissToast(toast.id)"
                  class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span class="sr-only">閉じる</span>
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </div>
            </div>

            <!-- Progress bar for auto-dismiss -->
            <div v-if="toast.autoDismiss" class="mt-3">
              <div class="w-full bg-gray-200 rounded-full h-1">
                <div
                  class="bg-blue-600 h-1 rounded-full transition-all duration-100 ease-linear"
                  :style="{ width: `${getProgressWidth(toast)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { NotificationHistoryItem } from '~/types/notification'
import { getTypeLabel, getSeverityLabel, getSeverityClass } from '~/utils/notificationHelpers'

// Icons (you might want to use a proper icon library)
const CheckCircleIcon = {
  template: `
    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `
}

const PlayIcon = {
  template: `
    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1" />
    </svg>
  `
}

const XMarkIcon = {
  template: `
    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `
}

// Toast interface
interface ToastNotification extends Omit<NotificationHistoryItem, 'id'> {
  id: string
  autoDismiss?: boolean
  duration?: number
  createdAt: number
  progress?: number
}

// Props
interface Props {
  maxToasts?: number
  defaultDuration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

const props = withDefaults(defineProps<Props>(), {
  maxToasts: 5,
  defaultDuration: 5000,
  position: 'top-right'
})

// Emits
const emit = defineEmits<{
  toastClick: [toast: ToastNotification]
  toastDismiss: [id: string]
}>()

// State
const toasts = ref<ToastNotification[]>([])
const timers = ref<Map<string, NodeJS.Timeout>>(new Map())

// Computed
const visibleToasts = computed(() => {
  return toasts.value.slice(0, props.maxToasts)
})

// Methods
const addToast = (notification: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'status'>) => {
  const toast: ToastNotification = {
    ...notification,
    id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    status: 'unread',
    autoDismiss: true,
    duration: props.defaultDuration,
    createdAt: Date.now(),
    progress: 0
  }

  // Add to beginning of array (newest first)
  toasts.value.unshift(toast)

  // Remove excess toasts
  if (toasts.value.length > props.maxToasts) {
    const removed = toasts.value.splice(props.maxToasts)
    removed.forEach(t => clearTimer(t.id))
  }

  // Set auto-dismiss timer
  if (toast.autoDismiss && toast.duration) {
    startProgressTimer(toast)
  }
}

const dismissToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
    clearTimer(id)
    emit('toastDismiss', id)
  }
}

const clearTimer = (id: string) => {
  const timer = timers.value.get(id)
  if (timer) {
    clearInterval(timer)
    timers.value.delete(id)
  }
}

const startProgressTimer = (toast: ToastNotification) => {
  if (!toast.duration) return

  const startTime = Date.now()
  const interval = 100 // Update every 100ms

  const timer = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = Math.min((elapsed / toast.duration!) * 100, 100)
    
    const toastIndex = toasts.value.findIndex(t => t.id === toast.id)
    if (toastIndex !== -1) {
      toasts.value[toastIndex].progress = progress
    }

    if (progress >= 100) {
      dismissToast(toast.id)
    }
  }, interval)

  timers.value.set(toast.id, timer)
}

const viewDetails = (toast: ToastNotification) => {
  emit('toastClick', toast)
  // You might want to navigate to a details page or open a modal
}

const pauseTimer = (id: string) => {
  clearTimer(id)
}

const resumeTimer = (toast: ToastNotification) => {
  if (toast.autoDismiss && toast.duration) {
    const remainingTime = toast.duration * (1 - (toast.progress || 0) / 100)
    if (remainingTime > 0) {
      setTimeout(() => dismissToast(toast.id), remainingTime)
    }
  }
}

// Utility methods
const getIcon = (type: string) => {
  return type === 'start' ? PlayIcon : CheckCircleIcon
}

const getIconClass = (type: string) => {
  return type === 'start' 
    ? 'text-green-400' 
    : 'text-purple-400'
}

const getToastClass = (type: string) => {
  return type === 'start'
    ? 'border-l-4 border-green-400'
    : 'border-l-4 border-purple-400'
}

const getProgressWidth = (toast: ToastNotification) => {
  return 100 - (toast.progress || 0)
}

// Public methods (exposed to parent)
defineExpose({
  addToast,
  dismissToast,
  clearAll: () => {
    toasts.value.forEach(t => clearTimer(t.id))
    toasts.value = []
  }
})

// Cleanup on unmount
onUnmounted(() => {
  timers.value.forEach(timer => clearInterval(timer))
  timers.value.clear()
})
</script>

<style scoped>
.toast-container {
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
}

/* Toast animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Position variants */
.toast-container.top-left {
  @apply top-4 left-4;
}

.toast-container.top-right {
  @apply top-4 right-4;
}

.toast-container.bottom-left {
  @apply bottom-4 left-4;
}

.toast-container.bottom-right {
  @apply bottom-4 right-4;
}
</style>