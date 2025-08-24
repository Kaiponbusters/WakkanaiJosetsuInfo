import { ref, readonly } from 'vue'
import { useNotificationLogger } from './useNotificationLogger'

/**
 * 再試行設定
 */
export interface RetryConfig {
  /** 最大再試行回数 */
  maxRetries: number
  /** 基本遅延時間（ミリ秒） */
  baseDelay: number
  /** 最大遅延時間（ミリ秒） */
  maxDelay: number
  /** 指数バックオフ係数 */
  backoffMultiplier: number
  /** ジッター係数（0-1） */
  jitterFactor: number
}

/**
 * 再試行結果
 */
export interface RetryResult<T> {
  /** 成功フラグ */
  success: boolean
  /** 結果データ（成功時） */
  data?: T
  /** エラー（失敗時） */
  error?: Error
  /** 試行回数 */
  attempts: number
  /** 総実行時間（ミリ秒） */
  totalDuration: number
}

/**
 * 失敗追跡情報
 */
export interface FailureTracker {
  /** 失敗回数 */
  failureCount: number
  /** 最初の失敗時刻 */
  firstFailureAt: string
  /** 最後の失敗時刻 */
  lastFailureAt: string
  /** 失敗理由のリスト */
  failureReasons: string[]
  /** 次回再試行可能時刻 */
  nextRetryAt?: string
}

/**
 * キューアイテム
 */
export interface QueueItem<T> {
  /** 一意ID */
  id: string
  /** 実行する操作 */
  operation: () => Promise<T>
  /** 再試行設定 */
  config: RetryConfig
  /** 失敗追跡情報 */
  failureTracker: FailureTracker
  /** 作成時刻 */
  createdAt: string
  /** 優先度（数値が小さいほど高優先度） */
  priority: number
}

/**
 * 定数定義
 */
const CONSTANTS = {
  DEFAULT_MAX_RETRIES: 3,
  DEFAULT_BASE_DELAY: 1000,
  DEFAULT_MAX_DELAY: 30000,
  DEFAULT_BACKOFF_MULTIPLIER: 2,
  DEFAULT_JITTER_FACTOR: 0.1,
  MAX_BATCH_SIZE: 5,
  QUEUE_PROCESSING_DELAY: 100
} as const

/**
 * デフォルト再試行設定
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: CONSTANTS.DEFAULT_MAX_RETRIES,
  baseDelay: CONSTANTS.DEFAULT_BASE_DELAY,
  maxDelay: CONSTANTS.DEFAULT_MAX_DELAY,
  backoffMultiplier: CONSTANTS.DEFAULT_BACKOFF_MULTIPLIER,
  jitterFactor: CONSTANTS.DEFAULT_JITTER_FACTOR
}

/**
 * 通知配信再試行メカニズムcomposable
 */
export const useNotificationRetry = () => {
  const logger = useNotificationLogger()
  
  // 失敗キュー
  const failureQueue = ref<QueueItem<any>[]>([])
  
  // 処理中フラグ
  const isProcessing = ref(false)
  
  // 統計情報
  const stats = ref({
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
    queueSize: 0,
    lastProcessedAt: null as string | null
  })

  /**
   * ジッター付き遅延時間を計算
   */
  const calculateDelay = (attempt: number, config: RetryConfig): number => {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt)
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay)
    
    // ジッターを追加（±jitterFactor%の範囲でランダム化）
    const jitter = cappedDelay * config.jitterFactor * (Math.random() * 2 - 1)
    
    return Math.max(0, cappedDelay + jitter)
  }

  /**
   * エラーを標準化
   */
  const normalizeError = (error: unknown): Error => {
    return error instanceof Error ? error : new Error('不明なエラー')
  }

  /**
   * 操作IDを生成
   */
  const generateOperationId = (): string => {
    return `retry-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * 成功結果を作成
   */
  const createSuccessResult = <T>(
    data: T, 
    attempts: number, 
    totalDuration: number
  ): RetryResult<T> => ({
    success: true,
    data,
    attempts,
    totalDuration
  })

  /**
   * 失敗結果を作成
   */
  const createFailureResult = <T>(
    error: Error, 
    attempts: number, 
    totalDuration: number
  ): RetryResult<T> => ({
    success: false,
    error,
    attempts,
    totalDuration
  })

  /**
   * 指数バックオフで再試行実行
   */
  const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    operationId?: string
  ): Promise<RetryResult<T>> => {
    const startTime = Date.now()
    let lastError: Error
    const id = operationId || generateOperationId()
    
    logger.debug('再試行付き操作を開始します', { 
      operationId: id, 
      config 
    })

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        logger.debug(`操作を実行します (試行 ${attempt + 1}/${config.maxRetries + 1})`, { 
          operationId: id 
        })
        
        const result = await operation()
        const totalDuration = Date.now() - startTime
        
        logger.info('操作が成功しました', { 
          operationId: id, 
          attempts: attempt + 1, 
          totalDuration 
        })
        
        return createSuccessResult(result, attempt + 1, totalDuration)
        
      } catch (error) {
        lastError = normalizeError(error)
        
        logger.warn(`操作が失敗しました (試行 ${attempt + 1}/${config.maxRetries + 1})`, { 
          operationId: id, 
          error: lastError.message,
          attempt: attempt + 1
        })
        
        // 最後の試行でない場合は遅延
        if (attempt < config.maxRetries) {
          const delay = calculateDelay(attempt, config)
          
          logger.debug(`${delay}ms後に再試行します`, { 
            operationId: id, 
            nextAttempt: attempt + 2,
            delay 
          })
          
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    const totalDuration = Date.now() - startTime
    
    logger.error('すべての再試行が失敗しました', { 
      operationId: id, 
      attempts: config.maxRetries + 1, 
      totalDuration,
      finalError: lastError!.message 
    })
    
    return createFailureResult(lastError!, config.maxRetries + 1, totalDuration)
  }

  /**
   * 失敗した操作をキューに追加
   */
  const queueFailedOperation = <T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    priority: number = 5,
    operationId?: string
  ): string => {
    const id = operationId || `queue-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    
    const queueItem: QueueItem<T> = {
      id,
      operation,
      config,
      failureTracker: {
        failureCount: 0,
        firstFailureAt: new Date().toISOString(),
        lastFailureAt: new Date().toISOString(),
        failureReasons: []
      },
      createdAt: new Date().toISOString(),
      priority
    }
    
    // 優先度順で挿入
    const insertIndex = failureQueue.value.findIndex(item => item.priority > priority)
    if (insertIndex === -1) {
      failureQueue.value.push(queueItem)
    } else {
      failureQueue.value.splice(insertIndex, 0, queueItem)
    }
    
    stats.value.queueSize = failureQueue.value.length
    
    logger.info('失敗した操作をキューに追加しました', { 
      operationId: id, 
      priority, 
      queueSize: stats.value.queueSize 
    })
    
    return id
  }

  /**
   * 失敗追跡情報を更新
   */
  const updateFailureTracker = (item: QueueItem<any>, error: Error): void => {
    item.failureTracker.failureCount++
    item.failureTracker.lastFailureAt = new Date().toISOString()
    item.failureTracker.failureReasons.push(error.message)
  }

  /**
   * 次回再試行時刻を設定
   */
  const scheduleNextRetry = (item: QueueItem<any>): void => {
    const delay = calculateDelay(item.failureTracker.failureCount - 1, item.config)
    item.failureTracker.nextRetryAt = new Date(Date.now() + delay).toISOString()
  }

  /**
   * キューアイテムを処理
   */
  const processQueueItem = async (item: QueueItem<any>): Promise<void> => {
    try {
      stats.value.totalRetries++
      
      // 単一の操作を実行（キューレベルでは再試行しない）
      try {
        await item.operation()
        
        // 成功時はキューから削除
        removeFromQueue(item.id)
        stats.value.successfulRetries++
        
        logger.info('キューアイテムの実行が成功しました', { 
          operationId: item.id 
        })
        
      } catch (error) {
        const normalizedError = normalizeError(error)
        
        // 失敗時は失敗追跡情報を更新
        updateFailureTracker(item, normalizedError)
        
        // 最大再試行回数に達した場合はキューから削除
        if (item.failureTracker.failureCount >= item.config.maxRetries) {
          removeFromQueue(item.id)
          stats.value.failedRetries++
          
          logger.error('キューアイテムが最大再試行回数に達しました', { 
            operationId: item.id,
            failureCount: item.failureTracker.failureCount,
            failureReasons: item.failureTracker.failureReasons
          })
          
        } else {
          // 次回再試行時刻を設定
          scheduleNextRetry(item)
          
          logger.warn('キューアイテムの実行が失敗しました', { 
            operationId: item.id,
            failureCount: item.failureTracker.failureCount,
            nextRetryAt: item.failureTracker.nextRetryAt
          })
        }
      }
      
    } catch (error) {
      logger.error('キューアイテムの処理中に予期しないエラーが発生しました', { 
        operationId: item.id, 
        error 
      })
      
      // 予期しないエラーの場合もキューから削除
      removeFromQueue(item.id)
      stats.value.failedRetries++
    }
  }

  /**
   * キューから操作を削除
   */
  const removeFromQueue = (operationId: string): boolean => {
    const index = failureQueue.value.findIndex(item => item.id === operationId)
    if (index !== -1) {
      failureQueue.value.splice(index, 1)
      stats.value.queueSize = failureQueue.value.length
      
      logger.debug('操作をキューから削除しました', { 
        operationId, 
        queueSize: stats.value.queueSize 
      })
      
      return true
    }
    return false
  }

  /**
   * キューを処理
   */
  const processQueue = async (): Promise<void> => {
    if (isProcessing.value || failureQueue.value.length === 0) {
      return
    }
    
    isProcessing.value = true
    
    try {
      logger.info('失敗キューの処理を開始します', { 
        queueSize: failureQueue.value.length 
      })
      
      // 再試行可能なアイテムのみを処理
      const now = new Date()
      const processableItems = failureQueue.value.filter(item => {
        if (!item.failureTracker.nextRetryAt) {
          return true
        }
        return new Date(item.failureTracker.nextRetryAt) <= now
      })
      
      if (processableItems.length === 0) {
        logger.debug('現在処理可能なキューアイテムがありません')
        return
      }
      
      // 優先度順で処理（最大バッチサイズまで並行処理）
      const batchSize = Math.min(CONSTANTS.MAX_BATCH_SIZE, processableItems.length)
      const batch = processableItems.slice(0, batchSize)
      
      const processingPromises = batch.map(item => processQueueItem(item))
      
      await Promise.allSettled(processingPromises)
      
      stats.value.lastProcessedAt = new Date().toISOString()
      
      logger.info('失敗キューの処理が完了しました', { 
        processedCount: batch.length,
        remainingQueueSize: failureQueue.value.length
      })
      
    } catch (error) {
      logger.error('キュー処理中にエラーが発生しました', { error })
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * キューをクリア
   */
  const clearQueue = (): void => {
    const clearedCount = failureQueue.value.length
    failureQueue.value = []
    stats.value.queueSize = 0
    
    logger.info('失敗キューをクリアしました', { clearedCount })
  }

  /**
   * 統計をリセット
   */
  const resetStats = (): void => {
    stats.value.totalRetries = 0
    stats.value.successfulRetries = 0
    stats.value.failedRetries = 0
    stats.value.queueSize = failureQueue.value.length
    stats.value.lastProcessedAt = null
    
    logger.info('再試行統計をリセットしました')
  }

  /**
   * キューの状態を取得
   */
  const getQueueStatus = () => {
    return {
      totalItems: failureQueue.value.length,
      processingItems: failureQueue.value.filter(item => 
        !item.failureTracker.nextRetryAt || 
        new Date(item.failureTracker.nextRetryAt) <= new Date()
      ).length,
      waitingItems: failureQueue.value.filter(item => 
        item.failureTracker.nextRetryAt && 
        new Date(item.failureTracker.nextRetryAt) > new Date()
      ).length,
      isProcessing: isProcessing.value
    }
  }

  return {
    // 状態
    failureQueue: readonly(failureQueue),
    isProcessing: readonly(isProcessing),
    stats: readonly(stats),
    
    // メソッド
    executeWithRetry,
    queueFailedOperation,
    removeFromQueue,
    processQueue,
    clearQueue,
    resetStats,
    getQueueStatus,
    
    // 設定
    DEFAULT_RETRY_CONFIG
  }
}