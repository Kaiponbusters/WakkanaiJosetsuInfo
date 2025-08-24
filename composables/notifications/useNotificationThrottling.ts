import { ref, onUnmounted, getCurrentInstance } from 'vue'

interface NotificationItem {
  id: string
  area: string
  type: 'start' | 'end'
  message: string
  timestamp?: string
  priority?: 'low' | 'normal' | 'high'
}

interface ProcessingStats {
  throttledCount: number
  batchedCount: number
  debouncedCount: number
  droppedCount: number
  lastProcessedAt: string | null
}

interface ThrottleConfig {
  maxQueueSize: number
  throttleDelay: number
  batchSize: number
  batchTimeout: number
  debounceDelay: number
  enablePriorityQueue: boolean
}

// デフォルト設定
const DEFAULT_CONFIG: ThrottleConfig = {
  maxQueueSize: 100,
  throttleDelay: 1000,
  batchSize: 10,
  batchTimeout: 1000,
  debounceDelay: 300,
  enablePriorityQueue: true
}

export function useNotificationThrottling(config: Partial<ThrottleConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  const notificationQueue = ref<NotificationItem[]>([])
  const batchQueue = ref<NotificationItem[]>([])
  const stats = ref<ProcessingStats>({
    throttledCount: 0,
    batchedCount: 0,
    debouncedCount: 0,
    droppedCount: 0,
    lastProcessedAt: null
  })

  let throttleCallback: ((notifications: NotificationItem[]) => void) | null = null
  let batchCallback: ((notifications: NotificationItem[]) => void) | null = null
  let debounceCallback: ((notification: NotificationItem) => void) | null = null
  
  const activeTimers = new Set<NodeJS.Timeout>()
  const throttleTimers = new Map<string, NodeJS.Timeout>()

  const getQueueSize = (): number => {
    return notificationQueue.value.length
  }

  const prioritizeNotifications = (notifications: NotificationItem[]): NotificationItem[] => {
    if (!finalConfig.enablePriorityQueue) {
      return notifications
    }

    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      const aPriority = priorityOrder[a.priority || 'normal']
      const bPriority = priorityOrder[b.priority || 'normal']
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority // 高優先度を先に
      }
      
      // 優先度が同じ場合は新しいものを先に
      const aTime = new Date(a.timestamp || 0).getTime()
      const bTime = new Date(b.timestamp || 0).getTime()
      return bTime - aTime
    })
  }

  const throttleNotification = async (notification: NotificationItem): Promise<void> => {
    // タイムスタンプを追加
    const enrichedNotification = {
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString()
    }

    // キューサイズ制限チェック
    if (notificationQueue.value.length >= finalConfig.maxQueueSize) {
      // 最も古い低優先度の通知を削除
      const lowPriorityIndex = notificationQueue.value.findIndex(n => 
        (n.priority || 'normal') === 'low'
      )
      
      if (lowPriorityIndex >= 0) {
        notificationQueue.value.splice(lowPriorityIndex, 1)
        stats.value.droppedCount++
      } else {
        // 低優先度がない場合は最も古いものを削除
        notificationQueue.value.shift()
        stats.value.droppedCount++
      }
    }

    // 同じ地域・タイプの通知があるかチェック
    const existingIndex = notificationQueue.value.findIndex(
      n => n.area === enrichedNotification.area && n.type === enrichedNotification.type
    )

    if (existingIndex >= 0) {
      // 既存の通知を更新（より新しい情報で）
      notificationQueue.value[existingIndex] = enrichedNotification
    } else {
      // 新しい通知を追加
      notificationQueue.value.push(enrichedNotification)
    }

    stats.value.throttledCount++

    // 地域・タイプ別のスロットリングキー
    const throttleKey = `${enrichedNotification.area}-${enrichedNotification.type}`
    
    // 既存のタイマーをクリア
    if (throttleTimers.has(throttleKey)) {
      clearTimeout(throttleTimers.get(throttleKey)!)
      throttleTimers.delete(throttleKey)
    }

    // 新しいタイマーを設定
    const timer = setTimeout(() => {
      if (throttleCallback && notificationQueue.value.length > 0) {
        const toProcess = prioritizeNotifications([...notificationQueue.value])
        notificationQueue.value = []
        stats.value.lastProcessedAt = new Date().toISOString()
        throttleCallback(toProcess)
      }
      throttleTimers.delete(throttleKey)
    }, finalConfig.throttleDelay)

    throttleTimers.set(throttleKey, timer)
    activeTimers.add(timer)
  }

  const setThrottleCallback = (callback: (notifications: NotificationItem[]) => void): void => {
    throttleCallback = callback
  }

  const batchNotifications = async (notifications: NotificationItem[]): Promise<void> => {
    if (batchCallback) {
      const prioritized = prioritizeNotifications(notifications)
      const limited = prioritized.slice(0, finalConfig.batchSize)
      stats.value.batchedCount += limited.length
      stats.value.lastProcessedAt = new Date().toISOString()
      batchCallback(limited)
    }
  }

  const setBatchCallback = (callback: (notifications: NotificationItem[]) => void): void => {
    batchCallback = callback
  }

  const setBatchSize = (size: number): void => {
    finalConfig.batchSize = size
  }

  let batchTimer: NodeJS.Timeout | null = null

  const addToBatch = (notification: NotificationItem): void => {
    const enrichedNotification = {
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString()
    }

    batchQueue.value.push(enrichedNotification)
    
    // バッチサイズに達した場合は即座に処理
    if (batchQueue.value.length >= finalConfig.batchSize) {
      processBatch()
      return
    }

    // タイマーをリセット
    if (batchTimer) {
      clearTimeout(batchTimer)
      activeTimers.delete(batchTimer)
    }

    batchTimer = setTimeout(() => {
      processBatch()
      batchTimer = null
    }, finalConfig.batchTimeout)

    activeTimers.add(batchTimer)
  }

  const processBatch = (): void => {
    if (batchCallback && batchQueue.value.length > 0) {
      const toProcess = prioritizeNotifications([...batchQueue.value])
      batchQueue.value = []
      stats.value.batchedCount += toProcess.length
      stats.value.lastProcessedAt = new Date().toISOString()
      batchCallback(toProcess)
    }
  }

  const setBatchTimeout = (timeout: number): void => {
    finalConfig.batchTimeout = timeout
  }

  const debounceTimers = new Map<string, NodeJS.Timeout>()

  const debounceNotification = (notification: NotificationItem): void => {
    const enrichedNotification = {
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString()
    }

    // 地域・タイプ別のデバウンスキー
    const debounceKey = `${enrichedNotification.area}-${enrichedNotification.type}`
    
    // 既存のタイマーをクリア
    if (debounceTimers.has(debounceKey)) {
      const existingTimer = debounceTimers.get(debounceKey)!
      clearTimeout(existingTimer)
      activeTimers.delete(existingTimer)
      debounceTimers.delete(debounceKey)
    }

    const timer = setTimeout(() => {
      if (debounceCallback) {
        stats.value.debouncedCount++
        stats.value.lastProcessedAt = new Date().toISOString()
        debounceCallback(enrichedNotification)
      }
      debounceTimers.delete(debounceKey)
    }, finalConfig.debounceDelay)

    debounceTimers.set(debounceKey, timer)
    activeTimers.add(timer)
  }

  const setDebounceCallback = (callback: (notification: NotificationItem) => void): void => {
    debounceCallback = callback
  }

  const getProcessingStats = (): ProcessingStats => {
    return { ...stats.value }
  }

  const resetStats = (): void => {
    stats.value = {
      throttledCount: 0,
      batchedCount: 0,
      debouncedCount: 0,
      droppedCount: 0,
      lastProcessedAt: null
    }
  }

  const cleanup = (): void => {
    // すべてのタイマーをクリア
    for (const timer of activeTimers) {
      clearTimeout(timer)
    }
    activeTimers.clear()
    throttleTimers.clear()
    debounceTimers.clear()
    
    if (batchTimer) {
      clearTimeout(batchTimer)
      batchTimer = null
    }
  }

  // コンポーネントのアンマウント時にクリーンアップ
  const instance = getCurrentInstance()
  if (instance) {
    onUnmounted(() => {
      cleanup()
    })
  }

  return {
    getQueueSize,
    throttleNotification,
    setThrottleCallback,
    batchNotifications,
    setBatchCallback,
    setBatchSize,
    addToBatch,
    setBatchTimeout,
    debounceNotification,
    setDebounceCallback,
    getProcessingStats,
    resetStats,
    cleanup
  }
}