import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNotificationRetry } from '~/composables/notifications/useNotificationRetry'

// モック
vi.mock('~/composables/notifications/useNotificationLogger', () => ({
  useNotificationLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

describe('useNotificationRetry', () => {
  let retryService: ReturnType<typeof useNotificationRetry>
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    retryService = useNotificationRetry()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('executeWithRetry', () => {
    it('成功した操作は再試行せずに結果を返す', async () => {
      const mockOperation = vi.fn().mockResolvedValue('成功')
      
      const result = await retryService.executeWithRetry(mockOperation)
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('成功')
      expect(result.attempts).toBe(1)
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('失敗した操作は設定された回数まで再試行する', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('失敗1'))
        .mockRejectedValueOnce(new Error('失敗2'))
        .mockResolvedValue('成功')
      
      const config = {
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitterFactor: 0
      }
      
      const resultPromise = retryService.executeWithRetry(mockOperation, config)
      
      // タイマーを進めて再試行を実行
      await vi.advanceTimersByTimeAsync(100) // 1回目の再試行遅延
      await vi.advanceTimersByTimeAsync(200) // 2回目の再試行遅延
      
      const result = await resultPromise
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('成功')
      expect(result.attempts).toBe(3)
      expect(mockOperation).toHaveBeenCalledTimes(3)
    })

    it('すべての再試行が失敗した場合は失敗結果を返す', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('常に失敗'))
      
      const config = {
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitterFactor: 0
      }
      
      const resultPromise = retryService.executeWithRetry(mockOperation, config)
      
      // タイマーを進めて再試行を実行
      await vi.advanceTimersByTimeAsync(100) // 1回目の再試行遅延
      await vi.advanceTimersByTimeAsync(200) // 2回目の再試行遅延
      
      const result = await resultPromise
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('常に失敗')
      expect(result.attempts).toBe(3) // 初回 + 2回の再試行
      expect(mockOperation).toHaveBeenCalledTimes(3)
    })

    it('指数バックオフで遅延時間が増加する', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('失敗1'))
        .mockRejectedValueOnce(new Error('失敗2'))
        .mockResolvedValue('成功')
      
      const config = {
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitterFactor: 0
      }
      
      const startTime = Date.now()
      const resultPromise = retryService.executeWithRetry(mockOperation, config)
      
      // 1回目の再試行（100ms遅延）
      await vi.advanceTimersByTimeAsync(100)
      expect(Date.now() - startTime).toBe(100)
      
      // 2回目の再試行（200ms遅延）
      await vi.advanceTimersByTimeAsync(200)
      expect(Date.now() - startTime).toBe(300)
      
      const result = await resultPromise
      expect(result.success).toBe(true)
    })

    it('最大遅延時間を超えない', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('失敗1'))
        .mockResolvedValue('成功')
      
      const config = {
        maxRetries: 1,
        baseDelay: 1000,
        maxDelay: 500, // baseDelayより小さい値
        backoffMultiplier: 2,
        jitterFactor: 0
      }
      
      const resultPromise = retryService.executeWithRetry(mockOperation, config)
      
      // maxDelayの500msで遅延されるはず
      await vi.advanceTimersByTimeAsync(500)
      
      const result = await resultPromise
      expect(result.success).toBe(true)
    })
  })

  describe('queueFailedOperation', () => {
    it('失敗した操作をキューに追加する', () => {
      const mockOperation = vi.fn().mockResolvedValue('テスト')
      
      const operationId = retryService.queueFailedOperation(mockOperation)
      
      expect(operationId).toBeDefined()
      expect(retryService.stats.value.queueSize).toBe(1)
      expect(retryService.failureQueue.value).toHaveLength(1)
    })

    it('優先度順でキューに挿入される', () => {
      const operation1 = vi.fn().mockResolvedValue('1')
      const operation2 = vi.fn().mockResolvedValue('2')
      const operation3 = vi.fn().mockResolvedValue('3')
      
      // 優先度: 5, 1, 3 の順で追加
      retryService.queueFailedOperation(operation1, retryService.DEFAULT_RETRY_CONFIG, 5)
      retryService.queueFailedOperation(operation2, retryService.DEFAULT_RETRY_CONFIG, 1)
      retryService.queueFailedOperation(operation3, retryService.DEFAULT_RETRY_CONFIG, 3)
      
      // 優先度順（1, 3, 5）で並んでいることを確認
      expect(retryService.failureQueue.value[0].priority).toBe(1)
      expect(retryService.failureQueue.value[1].priority).toBe(3)
      expect(retryService.failureQueue.value[2].priority).toBe(5)
    })
  })

  describe('removeFromQueue', () => {
    it('指定されたIDの操作をキューから削除する', () => {
      const mockOperation = vi.fn().mockResolvedValue('テスト')
      
      const operationId = retryService.queueFailedOperation(mockOperation)
      expect(retryService.stats.value.queueSize).toBe(1)
      
      const removed = retryService.removeFromQueue(operationId)
      
      expect(removed).toBe(true)
      expect(retryService.stats.value.queueSize).toBe(0)
      expect(retryService.failureQueue.value).toHaveLength(0)
    })

    it('存在しないIDの場合はfalseを返す', () => {
      const removed = retryService.removeFromQueue('存在しないID')
      
      expect(removed).toBe(false)
    })
  })

  describe('processQueue', () => {
    it('キューが空の場合は何もしない', async () => {
      expect(retryService.failureQueue.value).toHaveLength(0)
      
      await retryService.processQueue()
      
      expect(retryService.isProcessing.value).toBe(false)
    })

    it('成功した操作はキューから削除される', async () => {
      const mockOperation = vi.fn().mockResolvedValue('成功')
      
      retryService.queueFailedOperation(mockOperation)
      expect(retryService.stats.value.queueSize).toBe(1)
      
      await retryService.processQueue()
      
      expect(retryService.stats.value.queueSize).toBe(0)
      expect(retryService.stats.value.successfulRetries).toBe(1)
    })

    it('失敗した操作は失敗追跡情報が更新される', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('失敗'))
      
      const config = {
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitterFactor: 0
      }
      
      retryService.queueFailedOperation(mockOperation, config)
      
      const processPromise = retryService.processQueue()
      
      // 再試行の遅延を進める
      await vi.advanceTimersByTimeAsync(100)
      await vi.advanceTimersByTimeAsync(200)
      await vi.advanceTimersByTimeAsync(400)
      
      await processPromise
      
      // まだキューに残っている（次回再試行時刻が設定されている）
      expect(retryService.stats.value.queueSize).toBe(1)
      expect(retryService.failureQueue.value[0].failureTracker.failureCount).toBe(1)
      expect(retryService.failureQueue.value[0].failureTracker.nextRetryAt).toBeDefined()
    })

    it('最大再試行回数に達した操作はキューから削除される', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('常に失敗'))
      
      const config = {
        maxRetries: 1, // キューでの再試行回数（1回失敗したら削除）
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitterFactor: 0
      }
      
      retryService.queueFailedOperation(mockOperation, config)
      
      // 1回目の処理（失敗して最大再試行回数に達する）
      await retryService.processQueue()
      
      expect(retryService.stats.value.queueSize).toBe(0) // キューから削除される
      expect(retryService.stats.value.failedRetries).toBe(1)
    }, 10000)
  })

  describe('clearQueue', () => {
    it('キューをクリアする', () => {
      const mockOperation = vi.fn().mockResolvedValue('テスト')
      
      retryService.queueFailedOperation(mockOperation)
      retryService.queueFailedOperation(mockOperation)
      
      expect(retryService.stats.value.queueSize).toBe(2)
      
      retryService.clearQueue()
      
      expect(retryService.stats.value.queueSize).toBe(0)
      expect(retryService.failureQueue.value).toHaveLength(0)
    })
  })

  describe('getQueueStatus', () => {
    it('キューの状態を正しく返す', () => {
      const mockOperation = vi.fn().mockResolvedValue('テスト')
      
      // 処理可能なアイテムを追加
      retryService.queueFailedOperation(mockOperation)
      
      const status = retryService.getQueueStatus()
      
      expect(status.totalItems).toBe(1)
      expect(status.processingItems).toBe(1)
      expect(status.waitingItems).toBe(0)
      expect(status.isProcessing).toBe(false)
    })
  })

  describe('resetStats', () => {
    it('統計をリセットする', () => {
      // まず統計を変更するために実際の操作を実行
      const mockOperation = vi.fn().mockResolvedValue('成功')
      retryService.queueFailedOperation(mockOperation)
      
      // 統計の初期値を確認
      expect(retryService.stats.value.queueSize).toBe(1)
      
      retryService.resetStats()
      
      expect(retryService.stats.value.totalRetries).toBe(0)
      expect(retryService.stats.value.successfulRetries).toBe(0)
      expect(retryService.stats.value.failedRetries).toBe(0)
      expect(retryService.stats.value.lastProcessedAt).toBeNull()
      // queueSizeは実際のキューサイズを反映
      expect(retryService.stats.value.queueSize).toBe(1)
    })
  })
})