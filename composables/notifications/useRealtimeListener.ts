import type { RealtimeChannel } from '@supabase/supabase-js'
import type { SnowReport } from '~/types/snow'

/**
 * リアルタイムイベントの型定義
 */
export interface RealtimeEvent {
  /** イベントタイプ */
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  /** 新しいレコード */
  new: SnowReport | null
  /** 古いレコード */
  old: SnowReport | null
  /** テーブル名 */
  table: string
  /** スキーマ名 */
  schema: string
}

/**
 * 通知イベントの型定義
 */
export interface NotificationEvent {
  /** 通知ID */
  id: string
  /** 地域名 */
  area: string
  /** 通知タイプ（開始/終了） */
  type: 'start' | 'end'
  /** タイムスタンプ */
  timestamp: string
  /** 報告ID */
  reportId: number
  /** 通知メッセージ */
  message: string
}

/**
 * リアルタイムリスナーの設定
 */
export interface RealtimeListenerConfig {
  /** 自動再接続を有効にするか */
  autoReconnect: boolean
  /** 再接続の最大試行回数 */
  maxReconnectAttempts: number
  /** 再接続の基本遅延時間（ミリ秒） */
  reconnectDelay: number
}

/**
 * Supabaseリアルタイムリスナーcomposable
 * snow_reportsテーブルの変更を監視し、通知イベントを生成する
 */
export const useRealtimeListener = () => {
  const supabase = useSupabaseClient()
  
  // リアルタイムチャンネル
  const channel = ref<RealtimeChannel | null>(null)
  
  // 接続状態
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const connectionError = ref<string | null>(null)
  
  // 再接続設定
  const config = ref<RealtimeListenerConfig>({
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000
  })
  
  // 再接続カウンター
  const reconnectAttempts = ref(0)
  
  // イベントハンドラー
  const eventHandlers = ref<Array<(event: NotificationEvent) => void>>([])
  
  /**
   * リアルタイムイベントを通知イベントに変換
   */
  const transformToNotificationEvent = (event: RealtimeEvent): NotificationEvent | null => {
    try {
      if (!event.new) {
        return null
      }
      
      const snowReport = event.new
      const now = new Date().toISOString()
      
      // INSERTイベントの場合は開始通知
      if (event.eventType === 'INSERT') {
        return {
          id: `${snowReport.id}-start-${Date.now()}`,
          area: snowReport.area,
          type: 'start',
          timestamp: now,
          reportId: snowReport.id,
          message: `${snowReport.area}で除雪作業が開始されました`
        }
      }
      
      // UPDATEイベントで終了時間が設定された場合は終了通知
      if (event.eventType === 'UPDATE' && snowReport.end_time) {
        const oldReport = event.old
        if (!oldReport?.end_time && snowReport.end_time) {
          return {
            id: `${snowReport.id}-end-${Date.now()}`,
            area: snowReport.area,
            type: 'end',
            timestamp: now,
            reportId: snowReport.id,
            message: `${snowReport.area}で除雪作業が終了しました`
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('通知イベントの変換に失敗しました:', error)
      return null
    }
  }
  
  /**
   * リアルタイムイベントハンドラー
   */
  const handleRealtimeEvent = (payload: any) => {
    try {
      const event: RealtimeEvent = {
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        table: payload.table,
        schema: payload.schema
      }
      
      const notificationEvent = transformToNotificationEvent(event)
      if (notificationEvent) {
        // 登録されたハンドラーに通知イベントを送信
        eventHandlers.value.forEach(handler => {
          try {
            handler(notificationEvent)
          } catch (error) {
            console.error('通知イベントハンドラーでエラーが発生しました:', error)
          }
        })
      }
    } catch (error) {
      console.error('リアルタイムイベントの処理に失敗しました:', error)
    }
  }
  
  /**
   * リアルタイム購読を開始
   */
  const subscribe = async (): Promise<boolean> => {
    try {
      if (isConnecting.value || isConnected.value) {
        return true
      }
      
      isConnecting.value = true
      connectionError.value = null
      
      // 既存のチャンネルがある場合は削除
      if (channel.value) {
        await unsubscribe()
      }
      
      // 新しいチャンネルを作成
      channel.value = supabase
        .channel('snow_reports_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'snow_reports'
          },
          handleRealtimeEvent
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isConnected.value = true
            isConnecting.value = false
            reconnectAttempts.value = 0
            console.log('リアルタイム購読が開始されました')
          } else if (status === 'CHANNEL_ERROR') {
            isConnected.value = false
            isConnecting.value = false
            connectionError.value = 'チャンネルエラーが発生しました'
            console.error('リアルタイムチャンネルエラー')
            
            // 自動再接続
            if (config.value.autoReconnect && reconnectAttempts.value < config.value.maxReconnectAttempts) {
              scheduleReconnect()
            }
          } else if (status === 'TIMED_OUT') {
            isConnected.value = false
            isConnecting.value = false
            connectionError.value = '接続がタイムアウトしました'
            console.error('リアルタイム接続タイムアウト')
            
            // 自動再接続
            if (config.value.autoReconnect && reconnectAttempts.value < config.value.maxReconnectAttempts) {
              scheduleReconnect()
            }
          } else if (status === 'CLOSED') {
            isConnected.value = false
            isConnecting.value = false
            console.log('リアルタイム接続が閉じられました')
          }
        })
      
      return true
    } catch (error) {
      isConnecting.value = false
      connectionError.value = error instanceof Error ? error.message : '不明なエラーが発生しました'
      console.error('リアルタイム購読の開始に失敗しました:', error)
      return false
    }
  }
  
  /**
   * 再接続をスケジュール
   */
  const scheduleReconnect = () => {
    reconnectAttempts.value++
    const delay = Math.min(
      config.value.reconnectDelay * Math.pow(2, reconnectAttempts.value - 1),
      30000 // 最大30秒
    )
    
    console.log(`${delay}ms後に再接続を試行します (${reconnectAttempts.value}/${config.value.maxReconnectAttempts})`)
    
    setTimeout(() => {
      if (!isConnected.value && reconnectAttempts.value <= config.value.maxReconnectAttempts) {
        subscribe()
      }
    }, delay)
  }
  
  /**
   * リアルタイム購読を停止
   */
  const unsubscribe = async (): Promise<void> => {
    try {
      if (channel.value) {
        await supabase.removeChannel(channel.value as any)
        channel.value = null
      }
      
      isConnected.value = false
      isConnecting.value = false
      connectionError.value = null
      reconnectAttempts.value = 0
      
      console.log('リアルタイム購読が停止されました')
    } catch (error) {
      console.error('リアルタイム購読の停止に失敗しました:', error)
    }
  }
  
  /**
   * イベントハンドラーを追加
   */
  const addEventHandler = (handler: (event: NotificationEvent) => void): void => {
    eventHandlers.value.push(handler)
  }
  
  /**
   * イベントハンドラーを削除
   */
  const removeEventHandler = (handler: (event: NotificationEvent) => void): void => {
    const index = eventHandlers.value.indexOf(handler)
    if (index > -1) {
      eventHandlers.value.splice(index, 1)
    }
  }
  
  /**
   * すべてのイベントハンドラーをクリア
   */
  const clearEventHandlers = (): void => {
    eventHandlers.value = []
  }
  
  /**
   * 手動で再接続を実行
   */
  const reconnect = async (): Promise<boolean> => {
    await unsubscribe()
    reconnectAttempts.value = 0
    return await subscribe()
  }
  
  /**
   * 設定を更新
   */
  const updateConfig = (newConfig: Partial<RealtimeListenerConfig>): void => {
    config.value = { ...config.value, ...newConfig }
  }
  
  // コンポーネントがアンマウントされる際にクリーンアップ
  onUnmounted(() => {
    unsubscribe()
    clearEventHandlers()
  })
  
  return {
    // 状態
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
    connectionError: readonly(connectionError),
    reconnectAttempts: readonly(reconnectAttempts),
    config: readonly(config),
    
    // メソッド
    subscribe,
    unsubscribe,
    reconnect,
    addEventHandler,
    removeEventHandler,
    clearEventHandlers,
    updateConfig
  }
}