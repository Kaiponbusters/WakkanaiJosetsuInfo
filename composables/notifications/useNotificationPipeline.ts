import { ref, readonly, onUnmounted } from 'vue'
import type { NotificationEvent } from './useRealtimeListener'
import { useNotificationStorage } from './useNotificationStorage'
import { useNotificationHistoryService } from './useNotificationHistoryService'
import { useNotificationLogger } from './useNotificationLogger'
import { usePushNotificationService } from './usePushNotificationService'
import { useNotificationRetry } from './useNotificationRetry'
import { useNotificationErrorHandler } from './useNotificationErrorHandler'
import type { PushNotificationPayload } from './usePushNotificationService'
import type { RetryConfig } from './useNotificationRetry'

/**
 * 通知配信設定
 */
export interface NotificationDeliveryConfig {
  /** 配信遅延時間（ミリ秒） */
  deliveryDelay: number
  /** バッチ処理のサイズ */
  batchSize: number
  /** 配信タイムアウト時間（ミリ秒） */
  deliveryTimeout: number
  /** デバウンス時間（ミリ秒） */
  debounceTime: number
  /** 再試行設定 */
  retryConfig: RetryConfig
}

/**
 * 通知配信結果
 */
export interface NotificationDeliveryResult {
  /** 配信成功フラグ */
  success: boolean
  /** 配信された通知ID */
  notificationId: string
  /** 配信チャネル */
  channel: 'push' | 'in-app'
  /** エラーメッセージ（失敗時） */
  error?: string
  /** 配信時刻 */
  deliveredAt: string
}

/**
 * 通知フィルター条件
 */
export interface NotificationFilter {
  /** 購読地域リスト */
  subscribedAreas: string[]
  /** プッシュ通知有効フラグ */
  pushEnabled: boolean
  /** アプリ内通知有効フラグ */
  inAppEnabled: boolean
}

/**
 * 通知配信パイプラインcomposable
 * リアルタイムイベントを受け取り、ユーザー設定に基づいて通知を配信する
 */
export const useNotificationPipeline = () => {
  const { getPreferences } = useNotificationStorage()
  const historyService = useNotificationHistoryService()
  const { error: logError, info: logInfo, debug: logDebug } = useNotificationLogger()
  const pushService = usePushNotificationService()
  const retryService = useNotificationRetry()
  const errorHandler = useNotificationErrorHandler()
  
  // 配信設定
  const config = ref<NotificationDeliveryConfig>({
    deliveryDelay: 100, // 100ms遅延
    batchSize: 10, // 最大10件をバッチ処理
    deliveryTimeout: 5000, // 5秒タイムアウト
    debounceTime: 1000, // 1秒デバウンス
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitterFactor: 0.1
    }
  })
  
  // 配信キュー
  const deliveryQueue = ref<NotificationEvent[]>([])
  
  // 配信中フラグ
  const isDelivering = ref(false)
  
  // 配信統計
  const deliveryStats = ref({
    totalDelivered: 0,
    successCount: 0,
    failureCount: 0,
    lastDeliveryTime: null as string | null
  })
  
  // デバウンスタイマー
  let debounceTimer: NodeJS.Timeout | null = null
  
  // 再試行キュー処理タイマー
  let retryQueueTimer: NodeJS.Timeout | null = null
  
  /**
   * 通知イベントをフィルタリング
   */
  const filterNotification = async (event: NotificationEvent): Promise<boolean> => {
    try {
      const preferences = await getPreferences()
      
      if (!preferences) {
        logDebug('ユーザー設定が見つかりません', { eventId: event.id })
        return false
      }
      
      // 購読地域チェック
      if (!preferences.subscriptions.includes(event.area)) {
        logDebug('購読対象外の地域です', { 
          area: event.area, 
          subscriptions: preferences.subscriptions 
        })
        return false
      }
      
      // 通知が有効かチェック
      if (!preferences.enablePush && !preferences.enableInApp) {
        logDebug('すべての通知が無効になっています')
        return false
      }
      
      return true
    } catch (error) {
      logError('通知フィルタリング中にエラーが発生しました', { error, eventId: event.id })
      return false
    }
  }
  
  /**
   * 通知内容をフォーマット
   */
  const formatNotificationContent = (event: NotificationEvent): {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
  } => {
    const baseTitle = '稚内市除雪情報'
    
    return {
      title: baseTitle,
      body: event.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `snow-report-${event.reportId}-${event.type}`
    }
  }
  


  /**
   * プッシュ通知を送信（再試行機能付き）
   */
  const deliverPushNotification = async (event: NotificationEvent): Promise<NotificationDeliveryResult> => {
    try {
      logInfo('プッシュ通知の送信を開始します', { eventId: event.id })
      
      // プッシュ通知サービスの利用可能性をチェック
      if (!pushService.isSupported) {
        throw new Error('このブラウザはプッシュ通知をサポートしていません')
      }
      
      if (!pushService.isPermissionGranted()) {
        throw new Error('プッシュ通知の許可が得られていません')
      }
      
      if (!pushService.isServiceWorkerRegistered.value) {
        throw new Error('サービスワーカーが登録されていません')
      }
      
      const content = formatNotificationContent(event)
      
      // プッシュ通知ペイロードを作成
      const payload: PushNotificationPayload = {
        title: content.title,
        body: content.body,
        icon: content.icon,
        badge: content.badge,
        tag: content.tag,
        requireInteraction: false,
        actions: [
          {
            action: 'view',
            title: '詳細を見る'
          },
          {
            action: 'dismiss',
            title: '閉じる'
          }
        ],
        data: {
          eventId: event.id,
          area: event.area,
          type: event.type,
          reportId: event.reportId,
          timestamp: event.timestamp,
          url: '/notifications' // 通知詳細ページのURL
        }
      }
      
      // 再試行機能付きでプッシュ通知を送信
      const retryResult = await retryService.executeWithRetry(
        async () => {
          const success = await pushService.sendNotification(payload)
          if (!success) {
            throw new Error('プッシュ通知サービスでの送信に失敗しました')
          }
          return success
        },
        config.value.retryConfig,
        `push-${event.id}`
      )
      
      if (!retryResult.success) {
        throw retryResult.error
      }
      
      logInfo('プッシュ通知の送信が完了しました', { eventId: event.id })
      
      return {
        success: true,
        notificationId: event.id,
        channel: 'push',
        deliveredAt: new Date().toISOString()
      }
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error('不明なエラー')
      
      // エラーハンドラーでエラーを分類・ログ記録
      errorHandler.logError(normalizedError, { 
        eventId: event.id, 
        operation: 'push-notification-delivery',
        channel: 'push'
      })
      
      logError('プッシュ通知の送信に失敗しました（再試行含む）', { error: normalizedError, eventId: event.id })
      
      return {
        success: false,
        notificationId: event.id,
        channel: 'push',
        error: normalizedError.message,
        deliveredAt: new Date().toISOString()
      }
    }
  }
  
  /**
   * アプリ内通知を送信
   */
  const deliverInAppNotification = async (event: NotificationEvent): Promise<NotificationDeliveryResult> => {
    try {
      // アプリ内通知イベントを発行
      const customEvent = new CustomEvent('notification:show', {
        detail: {
          id: event.id,
          type: event.type === 'start' ? 'info' : 'success',
          title: '除雪情報更新',
          message: event.message,
          duration: 5000,
          actions: [
            {
              label: '詳細を見る',
              action: () => {
                logInfo('アプリ内通知の詳細ボタンがクリックされました', { eventId: event.id })
                // 詳細ページへの遷移処理をここに追加
              }
            }
          ]
        }
      })
      
      window.dispatchEvent(customEvent)
      
      return {
        success: true,
        notificationId: event.id,
        channel: 'in-app',
        deliveredAt: new Date().toISOString()
      }
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error('不明なエラー')
      
      // エラーハンドラーでエラーを分類・ログ記録
      errorHandler.logError(normalizedError, { 
        eventId: event.id, 
        operation: 'in-app-notification-delivery',
        channel: 'in-app'
      })
      
      logError('アプリ内通知の送信に失敗しました', { error: normalizedError, eventId: event.id })
      
      return {
        success: false,
        notificationId: event.id,
        channel: 'in-app',
        error: normalizedError.message,
        deliveredAt: new Date().toISOString()
      }
    }
  }
  
  /**
   * 通知を配信
   */
  const deliverNotification = async (event: NotificationEvent): Promise<NotificationDeliveryResult[]> => {
    const results: NotificationDeliveryResult[] = []
    
    try {
      const preferences = await getPreferences()
      if (!preferences) {
        throw new Error('ユーザー設定が見つかりません')
      }
      
      let pushNotificationSucceeded = false
      
      // プッシュ通知の配信
      if (preferences.enablePush) {
        logInfo('プッシュ通知の配信を試行します', { eventId: event.id })
        const pushResult = await deliverPushNotification(event)
        results.push(pushResult)
        pushNotificationSucceeded = pushResult.success
        
        if (pushResult.success) {
          logInfo('プッシュ通知が成功しました', { eventId: event.id })
        } else {
          logInfo('プッシュ通知が失敗しました。アプリ内通知にフォールバックします', { 
            eventId: event.id, 
            error: pushResult.error 
          })
        }
      }
      
      // アプリ内通知の配信（プッシュ通知が失敗した場合、または無効な場合）
      if (preferences.enableInApp && !pushNotificationSucceeded) {
        logInfo('アプリ内通知を配信します', { 
          eventId: event.id, 
          reason: preferences.enablePush ? 'プッシュ通知失敗のフォールバック' : 'プッシュ通知無効' 
        })
        const inAppResult = await deliverInAppNotification(event)
        results.push(inAppResult)
      } else if (pushNotificationSucceeded && preferences.enableInApp) {
        logInfo('プッシュ通知が成功したため、アプリ内通知をスキップします', { eventId: event.id })
      }
      
      // 配信成功時は履歴に追加
      const successfulDeliveries = results.filter(r => r.success)
      if (successfulDeliveries.length > 0) {
        const historyItem = {
          area: event.area,
          type: event.type,
          message: event.message,
          read: false
        }
        
        await historyService.addNotification(historyItem)
        logInfo('通知が履歴に追加されました', { eventId: event.id })
      } else {
        // すべての配信が失敗した場合は再試行キューに追加
        logInfo('すべての通知配信が失敗しました。再試行キューに追加します', { eventId: event.id })
        
        retryService.queueFailedOperation(
          () => deliverNotification(event),
          config.value.retryConfig,
          1, // 高優先度
          `notification-delivery-${event.id}`
        )
      }
      
    } catch (error) {
      logError('通知配信中にエラーが発生しました', { error, eventId: event.id })
      results.push({
        success: false,
        notificationId: event.id,
        channel: 'push',
        error: error instanceof Error ? error.message : '不明なエラー',
        deliveredAt: new Date().toISOString()
      })
    }
    
    return results
  }
  
  /**
   * バッチ配信処理
   */
  const processBatch = async (): Promise<void> => {
    if (isDelivering.value || deliveryQueue.value.length === 0) {
      return
    }
    
    isDelivering.value = true
    
    try {
      const batch = deliveryQueue.value.splice(0, config.value.batchSize)
      logInfo(`バッチ配信を開始します`, { batchSize: batch.length })
      
      const deliveryPromises = batch.map(async (event) => {
        try {
          // 配信遅延
          if (config.value.deliveryDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, config.value.deliveryDelay))
          }
          
          const results = await deliverNotification(event)
          
          // 統計を更新
          deliveryStats.value.totalDelivered++
          if (results.some(r => r.success)) {
            deliveryStats.value.successCount++
          } else {
            deliveryStats.value.failureCount++
          }
          
          return results
        } catch (error) {
          logError('個別通知の配信に失敗しました', { error, eventId: event.id })
          deliveryStats.value.failureCount++
          return []
        }
      })
      
      // タイムアウト付きで配信を実行
      await Promise.race([
        Promise.all(deliveryPromises),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('配信タイムアウト')), config.value.deliveryTimeout)
        )
      ])
      
      deliveryStats.value.lastDeliveryTime = new Date().toISOString()
      logInfo('バッチ配信が完了しました', { 
        processedCount: batch.length,
        queueRemaining: deliveryQueue.value.length 
      })
      
    } catch (error) {
      logError('バッチ配信中にエラーが発生しました', { error })
    } finally {
      isDelivering.value = false
      
      // キューに残りがある場合は次のバッチを処理
      if (deliveryQueue.value.length > 0) {
        setTimeout(processBatch, 100)
      }
    }
  }
  
  /**
   * 通知をキューに追加
   */
  const queueNotification = async (event: NotificationEvent): Promise<void> => {
    try {
      // フィルタリング
      const shouldDeliver = await filterNotification(event)
      if (!shouldDeliver) {
        logDebug('通知がフィルタリングされました', { eventId: event.id })
        return
      }
      
      // 重複チェック
      const isDuplicate = deliveryQueue.value.some(
        queued => queued.id === event.id || 
        (queued.reportId === event.reportId && queued.type === event.type)
      )
      
      if (isDuplicate) {
        logDebug('重複する通知をスキップしました', { eventId: event.id })
        return
      }
      
      // キューに追加
      deliveryQueue.value.push(event)
      logInfo('通知がキューに追加されました', { 
        eventId: event.id, 
        queueSize: deliveryQueue.value.length 
      })
      
      // デバウンス処理
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      debounceTimer = setTimeout(() => {
        processBatch()
      }, config.value.debounceTime)
      
    } catch (error) {
      logError('通知のキューイング中にエラーが発生しました', { error, eventId: event.id })
    }
  }
  
  /**
   * キューをクリア
   */
  const clearQueue = (): void => {
    deliveryQueue.value = []
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    logInfo('配信キューがクリアされました')
  }
  
  /**
   * 設定を更新
   */
  const updateConfig = (newConfig: Partial<NotificationDeliveryConfig>): void => {
    config.value = { ...config.value, ...newConfig }
    logInfo('配信設定が更新されました', { config: config.value })
  }
  
  /**
   * 統計をリセット
   */
  const resetStats = (): void => {
    deliveryStats.value = {
      totalDelivered: 0,
      successCount: 0,
      failureCount: 0,
      lastDeliveryTime: null
    }
    logInfo('配信統計がリセットされました')
  }
  
  // クリーンアップ
  onUnmounted(() => {
    clearQueue()
  })
  
  return {
    // 状態
    config: readonly(config),
    deliveryQueue: readonly(deliveryQueue),
    isDelivering: readonly(isDelivering),
    deliveryStats: readonly(deliveryStats),
    
    // メソッド
    queueNotification,
    clearQueue,
    updateConfig,
    resetStats,
    processBatch,
    
    // エラーハンドリング
    getErrorStats: errorHandler.getErrorStats,
    getUserFriendlyMessage: errorHandler.getUserFriendlyMessage,
    getRecoveryOptions: errorHandler.getRecoveryOptions
  }
}