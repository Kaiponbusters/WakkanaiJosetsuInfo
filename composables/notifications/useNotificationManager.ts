import { ref, computed, onUnmounted } from 'vue'
import { useNotificationStorage } from './useNotificationStorage'
import { useNotificationLogger } from './useNotificationLogger'
import { useRealtimeListener } from './useRealtimeListener'
import { useNotificationPipeline } from './useNotificationPipeline'
import { usePushNotificationService } from './usePushNotificationService'
import type { NotificationEvent } from './useRealtimeListener'

export interface NotificationPreferences {
  subscriptions: string[]
  enablePush: boolean
  enableInApp: boolean
  lastUpdated: string
}

export interface NotificationManager {
  initialize(): Promise<void>
  subscribe(area: string): Promise<void>
  unsubscribe(area: string): Promise<void>
  getSubscriptions(): string[]
  enableNotifications(): Promise<boolean>
  disableNotifications(): void
  isSubscribed(area: string): boolean
  getPreferences(): NotificationPreferences
  startRealtimeListening(): Promise<boolean>
  stopRealtimeListening(): Promise<void>
  isRealtimeConnected(): boolean
  getConnectionStatus(): {
    isConnected: boolean
    isConnecting: boolean
    error: string | null
    reconnectAttempts: number
  }
}

export const useNotificationManager = (): NotificationManager => {
  const storage = useNotificationStorage()
  const logger = useNotificationLogger()
  const realtimeListener = useRealtimeListener()
  const notificationPipeline = useNotificationPipeline()
  const pushService = usePushNotificationService()
  
  const isInitialized = ref(false)
  const subscriptions = ref<string[]>([])
  const pushEnabled = ref(false)
  const inAppEnabled = ref(true)
  
  const preferences = computed<NotificationPreferences>(() => ({
    subscriptions: subscriptions.value,
    enablePush: pushEnabled.value,
    enableInApp: inAppEnabled.value,
    lastUpdated: new Date().toISOString()
  }))

  /**
   * 通知イベントハンドラー
   */
  const handleNotificationEvent = async (event: NotificationEvent): Promise<void> => {
    try {
      logger.info('リアルタイム通知イベントを受信しました', { 
        eventId: event.id, 
        area: event.area, 
        type: event.type 
      })
      
      // 通知配信パイプラインにイベントを送信
      await notificationPipeline.queueNotification(event)
      
    } catch (error) {
      logger.error('通知イベントの処理中にエラーが発生しました', { error, eventId: event.id })
    }
  }

  const initialize = async (): Promise<void> => {
    try {
      logger.info('通知マネージャーを初期化しています')
      
      // ストレージから設定を読み込み
      const savedPreferences = await storage.getPreferences()
      if (savedPreferences) {
        subscriptions.value = savedPreferences.subscriptions || []
        pushEnabled.value = savedPreferences.enablePush ?? false
        inAppEnabled.value = savedPreferences.enableInApp ?? true
      }
      
      // プッシュ通知サービスを初期化
      await pushService.initialize()
      
      // リアルタイムリスナーにイベントハンドラーを登録
      realtimeListener.addEventHandler(handleNotificationEvent)
      
      isInitialized.value = true
      logger.info('通知マネージャーの初期化が完了しました')
    } catch (error) {
      logger.error('通知マネージャーの初期化に失敗しました', error)
      throw error
    }
  }

  const subscribe = async (area: string): Promise<void> => {
    try {
      if (!area || typeof area !== 'string') {
        throw new Error('Invalid area name provided')
      }
      
      if (subscriptions.value.includes(area)) {
        logger.warn(`Already subscribed to area: ${area}`)
        return
      }
      
      subscriptions.value.push(area)
      await storage.savePreferences(preferences.value)
      
      logger.info(`Subscribed to area: ${area}`)
    } catch (error) {
      logger.error(`Failed to subscribe to area: ${area}`, error)
      throw error
    }
  }

  const unsubscribe = async (area: string): Promise<void> => {
    try {
      const index = subscriptions.value.indexOf(area)
      if (index === -1) {
        logger.warn(`Not subscribed to area: ${area}`)
        return
      }
      
      subscriptions.value.splice(index, 1)
      await storage.savePreferences(preferences.value)
      
      logger.info(`Unsubscribed from area: ${area}`)
    } catch (error) {
      logger.error(`Failed to unsubscribe from area: ${area}`, error)
      throw error
    }
  }

  const getSubscriptions = (): string[] => {
    return [...subscriptions.value]
  }

  const enableNotifications = async (): Promise<boolean> => {
    try {
      logger.info('通知を有効化しています')
      
      // プッシュ通知の許可をリクエスト
      const pushPermissionGranted = await pushService.requestPermission()
      
      if (pushPermissionGranted) {
        pushEnabled.value = true
        logger.info('プッシュ通知が有効になりました')
      } else {
        pushEnabled.value = false
        logger.warn('プッシュ通知の許可が取得できませんでした。アプリ内通知にフォールバックします')
      }

      // アプリ内通知は常に有効
      inAppEnabled.value = true
      
      // 設定を保存
      await storage.savePreferences(preferences.value)
      
      logger.info(`通知が有効になりました (プッシュ: ${pushEnabled.value}, アプリ内: ${inAppEnabled.value})`)
      return pushEnabled.value || inAppEnabled.value
      
    } catch (error) {
      logger.error('通知の有効化に失敗しました', error)
      
      // フォールバック: アプリ内通知のみ有効
      pushEnabled.value = false
      inAppEnabled.value = true
      await storage.savePreferences(preferences.value)
      
      return true
    }
  }

  const disableNotifications = async (): Promise<void> => {
    try {
      pushEnabled.value = false
      inAppEnabled.value = false
      await storage.savePreferences(preferences.value)
      
      logger.info('すべての通知が無効になりました')
    } catch (error) {
      logger.error('通知の無効化に失敗しました', error)
      throw error
    }
  }

  /**
   * リアルタイムリスニングを開始
   */
  const startRealtimeListening = async (): Promise<boolean> => {
    try {
      logger.info('リアルタイムリスニングを開始しています')
      
      const success = await realtimeListener.subscribe()
      if (success) {
        logger.info('リアルタイムリスニングが開始されました')
      } else {
        logger.warn('リアルタイムリスニングの開始に失敗しました')
      }
      
      return success
    } catch (error) {
      logger.error('リアルタイムリスニングの開始中にエラーが発生しました', error)
      return false
    }
  }

  /**
   * リアルタイムリスニングを停止
   */
  const stopRealtimeListening = async (): Promise<void> => {
    try {
      logger.info('リアルタイムリスニングを停止しています')
      
      await realtimeListener.unsubscribe()
      
      logger.info('リアルタイムリスニングが停止されました')
    } catch (error) {
      logger.error('リアルタイムリスニングの停止中にエラーが発生しました', error)
    }
  }

  /**
   * リアルタイム接続状態を確認
   */
  const isRealtimeConnected = (): boolean => {
    return realtimeListener.isConnected.value
  }

  /**
   * 接続状態の詳細を取得
   */
  const getConnectionStatus = () => {
    return {
      isConnected: realtimeListener.isConnected.value,
      isConnecting: realtimeListener.isConnecting.value,
      error: realtimeListener.connectionError.value,
      reconnectAttempts: realtimeListener.reconnectAttempts.value
    }
  }

  const isSubscribed = (area: string): boolean => {
    return subscriptions.value.includes(area)
  }

  const getPreferences = (): NotificationPreferences => {
    return { ...preferences.value }
  }

  // クリーンアップ
  onUnmounted(() => {
    realtimeListener.removeEventHandler(handleNotificationEvent)
    stopRealtimeListening()
  })

  return {
    initialize,
    subscribe,
    unsubscribe,
    getSubscriptions,
    enableNotifications,
    disableNotifications,
    isSubscribed,
    getPreferences,
    startRealtimeListening,
    stopRealtimeListening,
    isRealtimeConnected,
    getConnectionStatus
  }
}