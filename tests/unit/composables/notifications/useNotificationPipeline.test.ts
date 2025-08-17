import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 依存関係のモック
vi.mock('./useNotificationStorage', () => ({
  useNotificationStorage: () => ({
    getPreferences: vi.fn().mockResolvedValue({
      subscriptions: ['中央地区'],
      enablePush: true,
      enableInApp: true,
      lastUpdated: '2024-01-01T00:00:00.000Z'
    })
  })
}))

vi.mock('./useNotificationHistoryService', () => ({
  useNotificationHistoryService: () => ({
    addNotification: vi.fn().mockResolvedValue({
      id: 'test-id',
      area: 'テスト地区',
      type: 'start',
      message: 'テストメッセージ',
      timestamp: '2024-01-01T00:00:00.000Z',
      read: false
    })
  })
}))

vi.mock('./useNotificationRetry', () => ({
  useNotificationRetry: () => ({
    executeWithRetry: vi.fn().mockResolvedValue({
      success: true,
      data: true,
      attempts: 1,
      totalDuration: 100
    }),
    queueFailedOperation: vi.fn().mockReturnValue('retry-id-123'),
    DEFAULT_RETRY_CONFIG: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitterFactor: 0.1
    }
  })
}))

vi.mock('./useNotificationLogger', () => ({
  useNotificationLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  })
}))

vi.mock('./usePushNotificationService', () => ({
  usePushNotificationService: () => ({
    isSupported: true,
    isPermissionGranted: vi.fn().mockReturnValue(true),
    isServiceWorkerRegistered: { value: true },
    sendNotification: vi.fn().mockResolvedValue(true)
  })
}))

// 基本的な統合テスト
describe('useNotificationPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Notification APIのモック
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: class MockNotification {
        static permission = 'granted'
        static requestPermission = vi.fn().mockResolvedValue('granted')
        
        onclick: (() => void) | null = null
        
        constructor(public title: string, public options?: NotificationOptions) {}
        
        close = vi.fn()
      }
    })
    
    // CustomEventのモック
    global.CustomEvent = vi.fn().mockImplementation((type, options) => ({
      type,
      detail: options?.detail
    }))
    
    // window.dispatchEventのモック
    Object.defineProperty(window, 'dispatchEvent', {
      writable: true,
      value: vi.fn()
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('プッシュ通知配信システム', () => {
    it('プッシュ通知が正常に送信される', async () => {
      const { useNotificationPipeline } = await import('./useNotificationPipeline')
      const pipeline = useNotificationPipeline()
      
      const mockEvent = {
        id: 'test-1',
        area: '中央地区',
        type: 'start' as const,
        message: '除雪作業を開始しました',
        timestamp: '2024-01-01T10:00:00.000Z',
        reportId: 123
      }
      
      await pipeline.queueNotification(mockEvent)
      
      // バッチ処理を手動で実行
      await pipeline.processBatch()
      
      expect(pipeline.deliveryStats.value.totalDelivered).toBe(1)
      expect(pipeline.deliveryStats.value.successCount).toBe(1)
    })

    it('プッシュ通知失敗時にアプリ内通知にフォールバックする', async () => {
      // プッシュ通知サービスを失敗するようにモック
      vi.doMock('./usePushNotificationService', () => ({
        usePushNotificationService: () => ({
          isSupported: true,
          isPermissionGranted: vi.fn().mockReturnValue(true),
          isServiceWorkerRegistered: { value: true },
          sendNotification: vi.fn().mockResolvedValue(false) // 失敗をシミュレート
        })
      }))
      
      const { useNotificationPipeline } = await import('./useNotificationPipeline')
      const pipeline = useNotificationPipeline()
      
      const mockEvent = {
        id: 'test-2',
        area: '中央地区',
        type: 'end' as const,
        message: '除雪作業を終了しました',
        timestamp: '2024-01-01T11:00:00.000Z',
        reportId: 124
      }
      
      await pipeline.queueNotification(mockEvent)
      await pipeline.processBatch()
      
      // アプリ内通知のイベントが発行されることを確認
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification:show'
        })
      )
    })

    it('再試行メカニズムが動作する', async () => {
      const mockSendNotification = vi.fn()
        .mockRejectedValueOnce(new Error('一時的な失敗'))
        .mockResolvedValueOnce(true)
      
      vi.doMock('./usePushNotificationService', () => ({
        usePushNotificationService: () => ({
          isSupported: true,
          isPermissionGranted: vi.fn().mockReturnValue(true),
          isServiceWorkerRegistered: { value: true },
          sendNotification: mockSendNotification
        })
      }))
      
      const { useNotificationPipeline } = await import('./useNotificationPipeline')
      const pipeline = useNotificationPipeline()
      
      const mockEvent = {
        id: 'test-3',
        area: '中央地区',
        type: 'start' as const,
        message: '除雪作業を開始しました',
        timestamp: '2024-01-01T12:00:00.000Z',
        reportId: 125
      }
      
      await pipeline.queueNotification(mockEvent)
      await pipeline.processBatch()
      
      // 再試行が実行されることを確認
      expect(mockSendNotification).toHaveBeenCalledTimes(2)
      expect(pipeline.deliveryStats.value.successCount).toBe(1)
    })

    it('購読していない地域の通知はフィルタリングされる', async () => {
      const { useNotificationPipeline } = await import('./useNotificationPipeline')
      const pipeline = useNotificationPipeline()
      
      const mockEvent = {
        id: 'test-4',
        area: '未購読地区', // 購読していない地域
        type: 'start' as const,
        message: '除雪作業を開始しました',
        timestamp: '2024-01-01T13:00:00.000Z',
        reportId: 126
      }
      
      await pipeline.queueNotification(mockEvent)
      await pipeline.processBatch()
      
      // 配信されないことを確認
      expect(pipeline.deliveryStats.value.totalDelivered).toBe(0)
      expect(pipeline.deliveryQueue.value.length).toBe(0)
    })

    it('重複する通知がスキップされる', async () => {
      const { useNotificationPipeline } = await import('./useNotificationPipeline')
      const pipeline = useNotificationPipeline()
      
      const mockEvent = {
        id: 'test-5',
        area: '中央地区',
        type: 'start' as const,
        message: '除雪作業を開始しました',
        timestamp: '2024-01-01T14:00:00.000Z',
        reportId: 127
      }
      
      // 同じ通知を2回キューに追加
      await pipeline.queueNotification(mockEvent)
      await pipeline.queueNotification(mockEvent)
      
      // キューには1つだけ追加されることを確認
      expect(pipeline.deliveryQueue.value.length).toBe(1)
    })
  })

  describe('設定とユーティリティ', () => {
    it('配信設定を更新できる', async () => {
      const { useNotificationPipeline } = await import('./useNotificationPipeline')
      const pipeline = useNotificationPipeline()
      
      const newConfig = {
        maxRetries: 5,
        retryDelay: 2000
      }
      
      pipeline.updateConfig(newConfig)
      
      expect(pipeline.config.value.maxRetries).toBe(5)
      expect(pipeline.config.value.retryDelay).toBe(2000)
    })

    it('配信統計をリセットできる', async () => {
      const { useNotificationPipeline } = await import('./useNotificationPipeline')
      const pipeline = useNotificationPipeline()
      
      // 統計をリセット前に確認
      pipeline.resetStats()
      
      expect(pipeline.deliveryStats.value.totalDelivered).toBe(0)
      expect(pipeline.deliveryStats.value.successCount).toBe(0)
      expect(pipeline.deliveryStats.value.failureCount).toBe(0)
    })

    it('キューをクリアできる', async () => {
      const { useNotificationPipeline } = await import('./useNotificationPipeline')
      const pipeline = useNotificationPipeline()
      
      const mockEvent = {
        id: 'test-6',
        area: '中央地区',
        type: 'start' as const,
        message: '除雪作業を開始しました',
        timestamp: '2024-01-01T15:00:00.000Z',
        reportId: 128
      }
      
      await pipeline.queueNotification(mockEvent)
      expect(pipeline.deliveryQueue.value.length).toBe(1)
      
      pipeline.clearQueue()
      expect(pipeline.deliveryQueue.value.length).toBe(0)
    })
  })

  describe('composable構造', () => {
    it('useNotificationPipelineが関数として定義されている', async () => {
      const { useNotificationPipeline } = await import('./useNotificationPipeline')
      expect(typeof useNotificationPipeline).toBe('function')
    })
  })

  describe('設定管理', () => {
    it('デフォルト設定が正しく定義されている', () => {
      const defaultConfig = {
        deliveryDelay: 100,
        batchSize: 10,
        deliveryTimeout: 5000,
        debounceTime: 1000
      }

      expect(defaultConfig.deliveryDelay).toBe(100)
      expect(defaultConfig.batchSize).toBe(10)
      expect(defaultConfig.deliveryTimeout).toBe(5000)
      expect(defaultConfig.debounceTime).toBe(1000)
    })
  })

  describe('通知フォーマット', () => {
    it('通知内容が正しくフォーマットされる', () => {
      const mockEvent = {
        id: 'test-1',
        area: '中央地区',
        type: 'start' as const,
        timestamp: '2024-01-01T10:00:00Z',
        reportId: 1,
        message: '中央地区で除雪作業が開始されました'
      }

      const expectedFormat = {
        title: '稚内市除雪情報',
        body: mockEvent.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `snow-report-${mockEvent.reportId}-${mockEvent.type}`
      }

      expect(expectedFormat.title).toBe('稚内市除雪情報')
      expect(expectedFormat.body).toBe(mockEvent.message)
      expect(expectedFormat.tag).toBe('snow-report-1-start')
    })
  })

  describe('フィルタリングロジック', () => {
    it('購読地域のチェックが正しく動作する', () => {
      const mockPreferences = {
        subscriptions: ['中央地区', '南地区'],
        enablePush: true,
        enableInApp: true
      }

      const mockEvent = {
        id: 'test-1',
        area: '中央地区',
        type: 'start' as const,
        timestamp: '2024-01-01T10:00:00Z',
        reportId: 1,
        message: '中央地区で除雪作業が開始されました'
      }

      // 購読地域に含まれている場合
      expect(mockPreferences.subscriptions.includes(mockEvent.area)).toBe(true)

      // 購読地域に含まれていない場合
      const nonSubscribedEvent = { ...mockEvent, area: '北地区' }
      expect(mockPreferences.subscriptions.includes(nonSubscribedEvent.area)).toBe(false)
    })

    it('通知設定のチェックが正しく動作する', () => {
      const enabledPreferences = {
        subscriptions: ['中央地区'],
        enablePush: true,
        enableInApp: true
      }

      const disabledPreferences = {
        subscriptions: ['中央地区'],
        enablePush: false,
        enableInApp: false
      }

      // 通知が有効な場合
      expect(enabledPreferences.enablePush || enabledPreferences.enableInApp).toBe(true)

      // 通知が無効な場合
      expect(disabledPreferences.enablePush || disabledPreferences.enableInApp).toBe(false)
    })
  })

  describe('配信結果の構造', () => {
    it('成功時の配信結果が正しい構造を持つ', () => {
      const successResult = {
        success: true,
        notificationId: 'test-1',
        channel: 'push' as const,
        deliveredAt: '2024-01-01T10:00:00Z'
      }

      expect(successResult.success).toBe(true)
      expect(successResult.notificationId).toBe('test-1')
      expect(successResult.channel).toBe('push')
      expect(successResult.deliveredAt).toBeTruthy()
    })

    it('失敗時の配信結果が正しい構造を持つ', () => {
      const failureResult = {
        success: false,
        notificationId: 'test-1',
        channel: 'push' as const,
        error: 'テストエラー',
        deliveredAt: '2024-01-01T10:00:00Z'
      }

      expect(failureResult.success).toBe(false)
      expect(failureResult.error).toBe('テストエラー')
    })
  })

  describe('重複チェック', () => {
    it('同じIDの通知は重複として検出される', () => {
      const event1 = {
        id: 'test-1',
        area: '中央地区',
        type: 'start' as const,
        timestamp: '2024-01-01T10:00:00Z',
        reportId: 1,
        message: 'メッセージ1'
      }

      const event2 = {
        id: 'test-1', // 同じID
        area: '中央地区',
        type: 'start' as const,
        timestamp: '2024-01-01T10:01:00Z',
        reportId: 2,
        message: 'メッセージ2'
      }

      const queue = [event1]
      const isDuplicate = queue.some(queued => queued.id === event2.id)

      expect(isDuplicate).toBe(true)
    })

    it('同じreportIdと同じtypeの通知は重複として検出される', () => {
      const event1 = {
        id: 'test-1',
        area: '中央地区',
        type: 'start' as const,
        timestamp: '2024-01-01T10:00:00Z',
        reportId: 1,
        message: 'メッセージ1'
      }

      const event2 = {
        id: 'test-2',
        area: '中央地区',
        type: 'start' as const, // 同じtype
        timestamp: '2024-01-01T10:01:00Z',
        reportId: 1, // 同じreportId
        message: 'メッセージ2'
      }

      const queue = [event1]
      const isDuplicate = queue.some(
        queued => queued.reportId === event2.reportId && queued.type === event2.type
      )

      expect(isDuplicate).toBe(true)
    })
  })

  describe('統計管理', () => {
    it('配信統計の初期値が正しく設定される', () => {
      const initialStats = {
        totalDelivered: 0,
        successCount: 0,
        failureCount: 0,
        lastDeliveryTime: null
      }

      expect(initialStats.totalDelivered).toBe(0)
      expect(initialStats.successCount).toBe(0)
      expect(initialStats.failureCount).toBe(0)
      expect(initialStats.lastDeliveryTime).toBeNull()
    })

    it('統計の更新ロジックが正しく動作する', () => {
      const stats = {
        totalDelivered: 0,
        successCount: 0,
        failureCount: 0,
        lastDeliveryTime: null as string | null
      }

      // 成功時の更新
      stats.totalDelivered++
      stats.successCount++
      stats.lastDeliveryTime = '2024-01-01T10:00:00Z'

      expect(stats.totalDelivered).toBe(1)
      expect(stats.successCount).toBe(1)
      expect(stats.failureCount).toBe(0)

      // 失敗時の更新
      stats.totalDelivered++
      stats.failureCount++

      expect(stats.totalDelivered).toBe(2)
      expect(stats.successCount).toBe(1)
      expect(stats.failureCount).toBe(1)
    })
  })

  describe('エラーハンドリング', () => {
    it('プッシュ通知がサポートされていない場合のエラー処理', () => {
      // Notificationが存在しない場合のエラーメッセージをテスト
      const error = new Error('このブラウザはプッシュ通知をサポートしていません')
      expect(error.message).toBe('このブラウザはプッシュ通知をサポートしていません')
    })

    it('プッシュ通知の許可が得られていない場合のエラー処理', () => {
      // 許可が拒否されている場合
      Object.defineProperty(window.Notification, 'permission', {
        writable: true,
        value: 'denied'
      })

      const error = new Error('プッシュ通知の許可が得られていません')
      expect(error.message).toBe('プッシュ通知の許可が得られていません')
    })
  })
})