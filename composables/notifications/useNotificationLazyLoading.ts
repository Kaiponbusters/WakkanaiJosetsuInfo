import { ref, computed, onUnmounted, getCurrentInstance } from 'vue'

interface MemoryUsage {
  used: number
  total: number
}

interface PerformanceMetrics {
  loadTime: number
  memoryUsage: number
}

interface MemoryLeakInfo {
  hasLeaks: boolean
  leakSources: string[]
}

interface CleanupResult {
  cleanedCount: number
}

interface ConnectionOptimizationResult {
  activeConnections: number
}

interface DisconnectionResult {
  disconnectedCount: number
}

// グローバルな接続プール管理
const connectionPool = new Map<string, any>()
const componentCache = new Map<string, any>()

export function useNotificationLazyLoading() {
  const isLoaded = ref(false)
  const loadStartTime = ref(0)
  const cleanupInterval = ref<NodeJS.Timeout | null>(null)

  const loadNotificationComponents = async (): Promise<void> => {
    if (isLoaded.value) {
      return
    }
    
    loadStartTime.value = Date.now()
    
    try {
      // 実際のコンポーネント遅延読み込み
      if (!componentCache.has('NotificationSettings')) {
        const { default: NotificationSettings } = await import('~/components/feature/NotificationSettings.vue')
        componentCache.set('NotificationSettings', NotificationSettings)
      }
      
      if (!componentCache.has('NotificationHistory')) {
        const { default: NotificationHistory } = await import('~/components/feature/NotificationHistory.vue')
        componentCache.set('NotificationHistory', NotificationHistory)
      }
      
      if (!componentCache.has('NotificationToast')) {
        const { default: NotificationToast } = await import('~/components/feature/NotificationToast.vue')
        componentCache.set('NotificationToast', NotificationToast)
      }
      
      isLoaded.value = true
      
      // 自動クリーンアップの開始
      startAutoCleanup()
    } catch (error) {
      console.error('通知コンポーネントの読み込みに失敗しました:', error)
      throw error
    }
  }

  const startAutoCleanup = (): void => {
    if (cleanupInterval.value) {
      return
    }
    
    // 5分ごとに自動クリーンアップを実行
    cleanupInterval.value = setInterval(() => {
      cleanupOldNotifications()
      cleanupOldSubscriptions()
    }, 5 * 60 * 1000)
  }

  const cleanupOldNotifications = (): CleanupResult => {
    try {
      const historyKey = 'notification-history'
      const stored = localStorage.getItem(historyKey)
      
      if (!stored) {
        return { cleanedCount: 0 }
      }
      
      const notifications = JSON.parse(stored)
      const now = Date.now()
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7日間
      const maxCount = 50 // 最大50件
      
      // 古い通知を削除
      const filtered = notifications.filter((notification: any) => {
        const age = now - new Date(notification.timestamp).getTime()
        return age < maxAge
      })
      
      // 件数制限
      const limited = filtered.slice(-maxCount)
      const cleanedCount = notifications.length - limited.length
      
      if (cleanedCount > 0) {
        localStorage.setItem(historyKey, JSON.stringify(limited))
      }
      
      return { cleanedCount }
    } catch (error) {
      console.error('通知履歴のクリーンアップに失敗しました:', error)
      return { cleanedCount: 0 }
    }
  }

  const cleanupOldSubscriptions = (): CleanupResult => {
    try {
      const prefsKey = 'notification-preferences'
      const stored = localStorage.getItem(prefsKey)
      
      if (!stored) {
        return { cleanedCount: 0 }
      }
      
      const preferences = JSON.parse(stored)
      const now = Date.now()
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30日間
      
      let cleanedCount = 0
      
      // 最終更新から30日以上経過した設定をリセット
      if (preferences.lastUpdated) {
        const age = now - new Date(preferences.lastUpdated).getTime()
        if (age > maxAge) {
          preferences.subscriptions = []
          preferences.lastUpdated = new Date().toISOString()
          localStorage.setItem(prefsKey, JSON.stringify(preferences))
          cleanedCount = 1
        }
      }
      
      return { cleanedCount }
    } catch (error) {
      console.error('購読設定のクリーンアップに失敗しました:', error)
      return { cleanedCount: 0 }
    }
  }

  const getMemoryUsage = (): MemoryUsage => {
    try {
      // ブラウザのメモリ情報を取得（利用可能な場合）
      if ('memory' in performance) {
        const memory = (performance as any).memory
        return {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) // MB
        }
      }
      
      // フォールバック: 概算値
      const componentCount = componentCache.size
      const connectionCount = connectionPool.size
      const estimated = (componentCount * 0.5) + (connectionCount * 0.1) // MB
      
      return {
        used: Math.round(estimated),
        total: 100 // 概算値
      }
    } catch (error) {
      console.error('メモリ使用量の取得に失敗しました:', error)
      return { used: 0, total: 100 }
    }
  }

  const optimizeRealtimeConnections = (): ConnectionOptimizationResult => {
    try {
      // 重複する接続を統合
      const uniqueConnections = new Set()
      
      for (const [key, connection] of connectionPool.entries()) {
        if (connection && typeof connection.close !== 'function') {
          // 無効な接続を削除
          connectionPool.delete(key)
        } else {
          uniqueConnections.add(key)
        }
      }
      
      return { activeConnections: uniqueConnections.size }
    } catch (error) {
      console.error('リアルタイム接続の最適化に失敗しました:', error)
      return { activeConnections: connectionPool.size }
    }
  }

  const disconnectInactiveConnections = (): DisconnectionResult => {
    try {
      let disconnectedCount = 0
      const now = Date.now()
      const inactiveThreshold = 10 * 60 * 1000 // 10分間
      
      for (const [key, connection] of connectionPool.entries()) {
        if (connection && connection.lastActivity) {
          const inactiveTime = now - connection.lastActivity
          if (inactiveTime > inactiveThreshold) {
            try {
              if (typeof connection.close === 'function') {
                connection.close()
              }
              connectionPool.delete(key)
              disconnectedCount++
            } catch (closeError) {
              console.warn(`接続 ${key} の切断に失敗しました:`, closeError)
            }
          }
        }
      }
      
      return { disconnectedCount }
    } catch (error) {
      console.error('非アクティブ接続の切断に失敗しました:', error)
      return { disconnectedCount: 0 }
    }
  }

  const collectPerformanceMetrics = (): PerformanceMetrics => {
    try {
      const loadTime = loadStartTime.value > 0 ? Date.now() - loadStartTime.value : 0
      const memoryInfo = getMemoryUsage()
      
      return {
        loadTime,
        memoryUsage: memoryInfo.used
      }
    } catch (error) {
      console.error('パフォーマンスメトリクスの収集に失敗しました:', error)
      return { loadTime: 0, memoryUsage: 0 }
    }
  }

  const detectMemoryLeaks = (): MemoryLeakInfo => {
    try {
      const leakSources: string[] = []
      let hasLeaks = false
      
      // コンポーネントキャッシュのサイズチェック
      if (componentCache.size > 10) {
        leakSources.push('component-cache-overflow')
        hasLeaks = true
      }
      
      // 接続プールのサイズチェック
      if (connectionPool.size > 5) {
        leakSources.push('connection-pool-overflow')
        hasLeaks = true
      }
      
      // メモリ使用量チェック
      const memoryInfo = getMemoryUsage()
      if (memoryInfo.used > 50) { // 50MB以上
        leakSources.push('high-memory-usage')
        hasLeaks = true
      }
      
      return { hasLeaks, leakSources }
    } catch (error) {
      console.error('メモリリークの検出に失敗しました:', error)
      return { hasLeaks: false, leakSources: [] }
    }
  }

  // クリーンアップ処理（コンポーネント内でのみ実行）
  const instance = getCurrentInstance()
  if (instance) {
    onUnmounted(() => {
      if (cleanupInterval.value) {
        clearInterval(cleanupInterval.value)
        cleanupInterval.value = null
      }
    })
  }

  return {
    isLoaded: computed(() => isLoaded.value),
    loadNotificationComponents,
    cleanupOldNotifications,
    cleanupOldSubscriptions,
    getMemoryUsage,
    optimizeRealtimeConnections,
    disconnectInactiveConnections,
    collectPerformanceMetrics,
    detectMemoryLeaks
  }
}