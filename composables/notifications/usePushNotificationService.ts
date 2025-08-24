import { ref, computed, readonly } from 'vue'
import { useNotificationLogger } from './useNotificationLogger'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
  }>
  data?: Record<string, any>
}

export interface PushNotificationService {
  isSupported: boolean
  permission: Ref<NotificationPermission>
  isServiceWorkerRegistered: Ref<boolean>
  registration: Ref<ServiceWorkerRegistration | null>
  initialize(): Promise<boolean>
  requestPermission(): Promise<boolean>
  registerServiceWorker(): Promise<boolean>
  sendNotification(payload: PushNotificationPayload): Promise<boolean>
  getPermissionStatus(): NotificationPermission
  isPermissionGranted(): boolean
  isPermissionDenied(): boolean
  unregisterServiceWorker(): Promise<boolean>
}

export const usePushNotificationService = (): PushNotificationService => {
  const logger = useNotificationLogger()
  
  // ブラウザサポート確認
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator
  
  // リアクティブな状態
  const permission = ref<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  )
  const isServiceWorkerRegistered = ref(false)
  const registration = ref<ServiceWorkerRegistration | null>(null)
  
  // 計算プロパティ
  const isPermissionGranted = computed(() => permission.value === 'granted')
  const isPermissionDenied = computed(() => permission.value === 'denied')

  /**
   * プッシュ通知サービスを初期化
   */
  const initialize = async (): Promise<boolean> => {
    try {
      logger.info('プッシュ通知サービスを初期化しています')
      
      if (!isSupported) {
        logger.warn('ブラウザがプッシュ通知をサポートしていません')
        return false
      }
      
      // 現在の許可状態を更新
      permission.value = Notification.permission
      
      // サービスワーカーを登録
      const swRegistered = await registerServiceWorker()
      if (!swRegistered) {
        logger.warn('サービスワーカーの登録に失敗しました')
        return false
      }
      
      logger.info('プッシュ通知サービスの初期化が完了しました')
      return true
      
    } catch (error) {
      logger.error('プッシュ通知サービスの初期化に失敗しました', error)
      return false
    }
  }

  /**
   * 通知許可をリクエスト
   */
  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!isSupported) {
        logger.warn('ブラウザがプッシュ通知をサポートしていません')
        return false
      }
      
      if (permission.value === 'granted') {
        logger.info('プッシュ通知の許可は既に取得済みです')
        return true
      }
      
      if (permission.value === 'denied') {
        logger.warn('プッシュ通知の許可が拒否されています')
        return false
      }
      
      logger.info('プッシュ通知の許可をリクエストしています')
      
      const result = await Notification.requestPermission()
      permission.value = result
      
      if (result === 'granted') {
        logger.info('プッシュ通知の許可が取得されました')
        return true
      } else {
        logger.warn(`プッシュ通知の許可が拒否されました: ${result}`)
        return false
      }
      
    } catch (error) {
      logger.error('プッシュ通知の許可リクエストに失敗しました', error)
      permission.value = 'denied'
      return false
    }
  }

  /**
   * サービスワーカーを登録
   */
  const registerServiceWorker = async (): Promise<boolean> => {
    try {
      if (!('serviceWorker' in navigator)) {
        logger.warn('ブラウザがサービスワーカーをサポートしていません')
        return false
      }
      
      logger.info('サービスワーカーを登録しています')
      
      const swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      // 登録完了を待機
      await new Promise<void>((resolve) => {
        if (swRegistration.installing) {
          swRegistration.installing.addEventListener('statechange', () => {
            if (swRegistration.installing?.state === 'installed') {
              resolve()
            }
          })
        } else {
          resolve()
        }
      })
      
      registration.value = swRegistration
      isServiceWorkerRegistered.value = true
      
      logger.info('サービスワーカーの登録が完了しました')
      return true
      
    } catch (error) {
      logger.error('サービスワーカーの登録に失敗しました', error)
      isServiceWorkerRegistered.value = false
      return false
    }
  }

  /**
   * プッシュ通知を送信
   */
  const sendNotification = async (payload: PushNotificationPayload): Promise<boolean> => {
    try {
      if (!isSupported) {
        logger.warn('ブラウザがプッシュ通知をサポートしていません')
        return false
      }
      
      if (permission.value !== 'granted') {
        logger.warn('プッシュ通知の許可が取得されていません')
        return false
      }
      
      if (!isServiceWorkerRegistered.value || !registration.value) {
        logger.warn('サービスワーカーが登録されていません')
        return false
      }
      
      logger.info('プッシュ通知を送信しています', { title: payload.title })
      
      // デフォルト値を設定
      const notificationOptions = {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag || 'snow-notification',
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions || [
          { action: 'view', title: '詳細を見る' },
          { action: 'dismiss', title: '閉じる' }
        ],
        data: payload.data || {}
      }
      
      // サービスワーカー経由で通知を表示
      await registration.value.showNotification(payload.title, notificationOptions)
      
      logger.info('プッシュ通知の送信が完了しました')
      return true
      
    } catch (error) {
      logger.error('プッシュ通知の送信に失敗しました', error)
      return false
    }
  }

  /**
   * 現在の許可状態を取得
   */
  const getPermissionStatus = (): NotificationPermission => {
    return permission.value
  }

  /**
   * サービスワーカーの登録を解除
   */
  const unregisterServiceWorker = async (): Promise<boolean> => {
    try {
      if (!registration.value) {
        logger.info('登録されたサービスワーカーがありません')
        return true
      }
      
      logger.info('サービスワーカーの登録を解除しています')
      
      const success = await registration.value.unregister()
      
      if (success) {
        registration.value = null
        isServiceWorkerRegistered.value = false
        logger.info('サービスワーカーの登録解除が完了しました')
      } else {
        logger.warn('サービスワーカーの登録解除に失敗しました')
      }
      
      return success
      
    } catch (error) {
      logger.error('サービスワーカーの登録解除中にエラーが発生しました', error)
      return false
    }
  }

  return {
    isSupported,
    permission: readonly(permission),
    isServiceWorkerRegistered: readonly(isServiceWorkerRegistered),
    registration: readonly(registration),
    initialize,
    requestPermission,
    registerServiceWorker,
    sendNotification,
    getPermissionStatus,
    isPermissionGranted: () => isPermissionGranted.value,
    isPermissionDenied: () => isPermissionDenied.value,
    unregisterServiceWorker
  }
}