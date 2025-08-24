import { ref, readonly } from 'vue'
import { useNotificationRetry } from './useNotificationRetry'
import { useNotificationErrorHandler } from './useNotificationErrorHandler'
import { useNotificationLogger } from './useNotificationLogger'

/**
 * 統合エラー処理結果
 */
export interface IntegratedErrorResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  recoveryAttempted: boolean
  recoverySuccess?: boolean
}

/**
 * エラー処理設定
 */
export interface ErrorHandlingConfig {
  enableAutoRecovery: boolean
  maxRecoveryAttempts: number
  logErrors: boolean
  showUserFriendlyMessages: boolean
}

/**
 * デフォルトエラー処理設定
 */
const DEFAULT_ERROR_HANDLING_CONFIG: ErrorHandlingConfig = {
  enableAutoRecovery: true,
  maxRecoveryAttempts: 2,
  logErrors: true,
  showUserFriendlyMessages: true
}

/**
 * 通知エラーハンドリング統合composable
 */
export const useNotificationErrorIntegration = () => {
  const retryService = useNotificationRetry()
  const errorHandler = useNotificationErrorHandler()
  const logger = useNotificationLogger()
  
  // 統合統計
  const integrationStats = ref({
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    recoveredOperations: 0,
    lastOperationTime: null as string | null
  })

  /**
   * エラーハンドリング付きで操作を実行
   */
  const executeWithErrorHandling = async <T>(
    operation: () => Promise<T>,
    config: ErrorHandlingConfig = DEFAULT_ERROR_HANDLING_CONFIG,
    operationId?: string
  ): Promise<IntegratedErrorResult<T>> => {
    const startTime = Date.now()
    const id = operationId || `integrated-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    
    integrationStats.value.totalOperations++
    integrationStats.value.lastOperationTime = new Date().toISOString()
    
    logger.info('統合エラーハンドリング付き操作を開始します', { 
      operationId: id, 
      config 
    })

    try {
      // 再試行メカニズム付きで操作を実行
      const retryResult = await retryService.executeWithRetry(operation, undefined, id)
      
      if (retryResult.success) {
        integrationStats.value.successfulOperations++
        
        logger.info('操作が成功しました', { 
          operationId: id, 
          attempts: retryResult.attempts,
          duration: Date.now() - startTime
        })
        
        return {
          success: true,
          data: retryResult.data,
          attempts: retryResult.attempts,
          recoveryAttempted: false
        }
      }
      
      // 操作が失敗した場合、エラーハンドリングを実行
      const error = retryResult.error!
      
      if (config.logErrors) {
        errorHandler.logError(error, { operationId: id, attempts: retryResult.attempts })
      }
      
      // 自動回復を試行
      let recoverySuccess = false
      if (config.enableAutoRecovery) {
        recoverySuccess = await attemptAutoRecovery(error, config.maxRecoveryAttempts, id)
      }
      
      if (recoverySuccess) {
        integrationStats.value.recoveredOperations++
        
        // 回復後に操作を再実行
        try {
          const recoveredResult = await operation()
          integrationStats.value.successfulOperations++
          
          logger.info('回復後の操作が成功しました', { 
            operationId: id,
            totalDuration: Date.now() - startTime
          })
          
          return {
            success: true,
            data: recoveredResult,
            attempts: retryResult.attempts + 1,
            recoveryAttempted: true,
            recoverySuccess: true
          }
          
        } catch (recoveredError) {
          const normalizedError = recoveredError instanceof Error 
            ? recoveredError 
            : new Error('回復後の操作で不明なエラーが発生しました')
          
          logger.error('回復後の操作が失敗しました', { 
            operationId: id,
            error: normalizedError.message
          })
          
          integrationStats.value.failedOperations++
          
          return {
            success: false,
            error: normalizedError,
            attempts: retryResult.attempts + 1,
            recoveryAttempted: true,
            recoverySuccess: false
          }
        }
      }
      
      // 回復に失敗した場合
      integrationStats.value.failedOperations++
      
      logger.error('操作と回復の両方が失敗しました', { 
        operationId: id,
        error: error.message,
        attempts: retryResult.attempts,
        totalDuration: Date.now() - startTime
      })
      
      return {
        success: false,
        error,
        attempts: retryResult.attempts,
        recoveryAttempted: config.enableAutoRecovery,
        recoverySuccess: false
      }
      
    } catch (unexpectedError) {
      const normalizedError = unexpectedError instanceof Error 
        ? unexpectedError 
        : new Error('予期しないエラーが発生しました')
      
      integrationStats.value.failedOperations++
      
      if (config.logErrors) {
        errorHandler.logError(normalizedError, { 
          operationId: id, 
          phase: 'unexpected',
          duration: Date.now() - startTime
        })
      }
      
      logger.error('予期しないエラーが発生しました', { 
        operationId: id,
        error: normalizedError.message
      })
      
      return {
        success: false,
        error: normalizedError,
        attempts: 1,
        recoveryAttempted: false
      }
    }
  }

  /**
   * 自動回復を試行
   */
  const attemptAutoRecovery = async (
    error: Error, 
    maxAttempts: number, 
    operationId: string
  ): Promise<boolean> => {
    logger.info('自動回復を開始します', { 
      operationId, 
      error: error.message, 
      maxAttempts 
    })
    
    const recoveryOptions = errorHandler.getRecoveryOptions(error)
    
    // 優先度順で回復オプションを試行
    const sortedOptions = recoveryOptions.sort((a, b) => a.priority - b.priority)
    
    for (let attempt = 0; attempt < Math.min(maxAttempts, sortedOptions.length); attempt++) {
      const option = sortedOptions[attempt]
      
      logger.debug(`回復オプションを試行します: ${option.label}`, { 
        operationId, 
        attempt: attempt + 1,
        maxAttempts
      })
      
      try {
        const recoveryResult = await errorHandler.attemptRecovery(error, option.action)
        
        if (recoveryResult.success) {
          logger.info(`回復オプション「${option.label}」が成功しました`, { 
            operationId,
            attempt: attempt + 1
          })
          
          return true
        }
        
        logger.warn(`回復オプション「${option.label}」が失敗しました`, { 
          operationId,
          attempt: attempt + 1,
          error: recoveryResult.error?.message
        })
        
      } catch (recoveryError) {
        const normalizedError = recoveryError instanceof Error 
          ? recoveryError 
          : new Error('回復処理中に不明なエラーが発生しました')
        
        logger.error(`回復オプション「${option.label}」で例外が発生しました`, { 
          operationId,
          attempt: attempt + 1,
          error: normalizedError.message
        })
      }
    }
    
    logger.warn('すべての自動回復オプションが失敗しました', { 
      operationId,
      attemptedOptions: sortedOptions.length,
      maxAttempts
    })
    
    return false
  }

  /**
   * ユーザーフレンドリーなエラー情報を取得
   */
  const getUserErrorInfo = (error: Error) => {
    const classification = errorHandler.classifyError(error)
    const userMessage = errorHandler.getUserFriendlyMessage(error)
    const recoveryOptions = errorHandler.getRecoveryOptions(error)
    
    return {
      classification,
      userMessage,
      recoveryOptions: recoveryOptions.map(option => ({
        label: option.label,
        priority: option.priority,
        action: option.action
      }))
    }
  }

  /**
   * 失敗した操作をキューに追加（エラーハンドリング付き）
   */
  const queueFailedOperationWithErrorHandling = <T>(
    operation: () => Promise<T>,
    config: ErrorHandlingConfig = DEFAULT_ERROR_HANDLING_CONFIG,
    priority: number = 5,
    operationId?: string
  ): string => {
    const wrappedOperation = async (): Promise<T> => {
      const result = await executeWithErrorHandling(operation, config, operationId)
      
      if (result.success) {
        return result.data!
      } else {
        throw result.error || new Error('操作が失敗しました')
      }
    }
    
    return retryService.queueFailedOperation(wrappedOperation, undefined, priority, operationId)
  }

  /**
   * 統計を取得
   */
  const getIntegrationStats = () => {
    return {
      integration: { ...integrationStats.value },
      retry: retryService.stats.value,
      error: errorHandler.getErrorStats()
    }
  }

  /**
   * 統計をリセット
   */
  const resetIntegrationStats = (): void => {
    integrationStats.value = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      recoveredOperations: 0,
      lastOperationTime: null
    }
    
    retryService.resetStats()
    errorHandler.resetStats()
    
    logger.info('統合エラーハンドリング統計をリセットしました')
  }

  return {
    // 状態
    integrationStats: readonly(integrationStats),
    
    // メソッド
    executeWithErrorHandling,
    getUserErrorInfo,
    queueFailedOperationWithErrorHandling,
    getIntegrationStats,
    resetIntegrationStats,
    
    // 子サービスへのアクセス
    retryService,
    errorHandler,
    
    // 設定
    DEFAULT_ERROR_HANDLING_CONFIG
  }
}